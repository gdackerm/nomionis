// SPDX-FileCopyrightText: Copyright Orangebot, Inc.
// SPDX-License-Identifier: Apache-2.0
import { ActionIcon, Card, Flex, Grid, Menu, Stack, Text, TextInput } from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import type { JSX } from 'react';
import { useEffect, useState } from 'react';
import type { Tables } from '../../lib/supabase/types';
import { HTTP_HL7_ORG } from '../../lib/utils';
import { chargeItemService } from '../../services/charge-item.service';
import { applyChargeItemDefinition } from '../../utils/chargeitems';

type ChargeItem = Tables<'charge_items'>;

const CHARGE_ITEM_MODIFIER_URL = `${HTTP_HL7_ORG}/fhir/StructureDefinition/chargeitem-modifier`;
const CPT_CODE_SYSTEM = 'http://www.ama-assn.org/go/cpt';

export interface ChargeItemPanelProps {
  chargeItem: ChargeItem;
  onChange: (chargeItem: ChargeItem) => void;
  onDelete: (chargeItem: ChargeItem) => void;
}

export default function ChargeItemPanel(props: ChargeItemPanelProps): JSX.Element {
  const { chargeItem, onChange, onDelete } = props;
  const [cptCodeDisplay, setCptCodeDisplay] = useState<string>('');
  const [price, setPrice] = useState<number | null>(null);

  useEffect(() => {
    setPrice(chargeItem.price_override);
    const coding = (chargeItem.code as any)?.coding;
    const cptCoding = coding?.filter((c: any) => c.system === CPT_CODE_SYSTEM) ?? [];
    const display = cptCoding.map((c: any) => `${c.code ?? ''} - ${c.display ?? ''}`).join(', ');
    setCptCodeDisplay(display);
  }, [chargeItem]);

  const updateChargeItem = async (updatedFields: Partial<ChargeItem>): Promise<void> => {
    const updated = await chargeItemService.update(chargeItem.id, updatedFields);
    const appliedChargeItem = await applyChargeItemDefinition(updated as ChargeItem);
    onChange(appliedChargeItem);
  };

  const deleteChargeItem = async (): Promise<void> => {
    await chargeItemService.delete(chargeItem.id);
    onDelete(chargeItem);
  };

  return (
    <Card withBorder shadow="sm" p={0}>
      <Stack gap="xs" p="md">
        <Flex justify="space-between" align="flex-start">
          <TextInput
            label="CPT Code"
            value={cptCodeDisplay}
            readOnly
            disabled
            flex={1}
            mr="md"
            maw="calc(100% - 60px)"
          />
          <Menu shadow="md" width={200} position="bottom-end">
            <Menu.Target>
              <ActionIcon variant="subtle">
                <IconTrash size={24} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item color="red" leftSection={<IconTrash size={16} />} onClick={deleteChargeItem}>
                Delete
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Flex>

        <TextInput
          label="Modifiers"
          placeholder="Modifiers are not editable in this view"
          readOnly
          value={getModifierDisplay(chargeItem)}
        />

        <Grid columns={12} mt="md">
          <Grid.Col span={7}>
            <Flex h="100%" direction="column" justify="flex-end" pt={4}>
              <Text size="sm" c="dimmed">
                Price calculated from Price chart, taking into account applied modifiers and patient's selected
                insurance plan.
              </Text>
            </Flex>
          </Grid.Col>
          <Grid.Col span={5}>
            <Text size="sm" fw={500} mb={8}>
              Calculated Price
            </Text>
            <TextInput value={price != null ? `$${price.toFixed(2)}` : 'N/A'} readOnly />
          </Grid.Col>
        </Grid>
      </Stack>
    </Card>
  );
}

function getModifierDisplay(chargeItem: ChargeItem): string {
  // Modifiers were stored in FHIR extensions; in the Supabase model
  // they may be part of the code JSONB or a separate field.
  // For now, attempt to read from the code JSONB extensions if present.
  const coding = (chargeItem.code as any)?.coding;
  if (!coding) return '';
  const modifiers = coding.filter((c: any) => c.system === 'http://hl7.org/fhir/ValueSet/claim-modifiers');
  return modifiers.map((m: any) => `${m.code ?? ''} - ${m.display ?? ''}`).join(', ');
}
