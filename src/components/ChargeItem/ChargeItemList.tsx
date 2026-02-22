// SPDX-FileCopyrightText: Copyright Orangebot, Inc.
// SPDX-License-Identifier: Apache-2.0
import { Box, Button, Card, Flex, Modal, Stack, Text, TextInput } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus } from '@tabler/icons-react';
import type { JSX } from 'react';
import { useCallback, useEffect, useState } from 'react';
import type { Tables, Json } from '../../lib/supabase/types';
import { HTTP_HL7_ORG } from '../../lib/utils';
import { chargeItemService } from '../../services/charge-item.service';
import { useAuth } from '../../providers/AuthProvider';
import { applyChargeItemDefinition, calculateTotalPrice } from '../../utils/chargeitems';
import { showErrorNotification } from '../../utils/notifications';
import ChargeItemPanel from './ChargeItemPanel';

type ChargeItem = Tables<'charge_items'>;
type Patient = Tables<'patients'>;
type Encounter = Tables<'encounters'>;

export interface ChargeItemListProps {
  chargeItems: ChargeItem[];
  updateChargeItems: (chargeItems: ChargeItem[]) => void;
  patient: Patient;
  encounter: Encounter;
}

export const ChargeItemList = (props: ChargeItemListProps): JSX.Element => {
  const { chargeItems, updateChargeItems, patient, encounter } = props;
  const [chargeItemsState, setChargeItemsState] = useState<ChargeItem[]>(chargeItems);
  const [opened, { open, close }] = useDisclosure(false);
  const { organizationId } = useAuth();

  useEffect(() => {
    setChargeItemsState(chargeItems);
  }, [chargeItems]);

  const updateChargeItemList = useCallback(
    async (updatedChargeItem: ChargeItem): Promise<void> => {
      const updatedChargeItems = chargeItemsState.map((item) =>
        item.id === updatedChargeItem.id ? updatedChargeItem : item
      );
      updateChargeItems(updatedChargeItems);
    },
    [chargeItemsState, updateChargeItems]
  );

  const deleteChargeItem = useCallback(
    async (chargeItem: ChargeItem): Promise<void> => {
      const updatedChargeItems = chargeItemsState.filter((item) => item.id !== chargeItem.id);
      updateChargeItems(updatedChargeItems);
    },
    [chargeItemsState, updateChargeItems]
  );

  const addChargeItem = useCallback(async (): Promise<void> => {
    open();
  }, [open]);

  const handleAddChargeItem = useCallback(
    async (
      cptCode: string,
      cptDisplay: string,
      definitionCanonical: string
    ): Promise<void> => {
      if (!cptCode) {
        showErrorNotification('Please enter a CPT code');
        return;
      }

      if (!organizationId) {
        showErrorNotification('Organization not found');
        return;
      }

      try {
        const code: Json = {
          coding: [
            {
              system: 'http://www.ama-assn.org/go/cpt',
              code: cptCode,
              display: cptDisplay || cptCode,
            },
          ],
        };

        const createdChargeItem = await chargeItemService.create({
          organization_id: organizationId,
          patient_id: patient.id,
          encounter_id: encounter.id,
          status: 'planned',
          code,
          quantity: 1,
          definition_canonical: definitionCanonical || null,
        });

        const appliedChargeItem = await applyChargeItemDefinition(createdChargeItem as ChargeItem);

        updateChargeItems([...chargeItemsState, appliedChargeItem]);
        close();
      } catch (err) {
        showErrorNotification(err);
      }
    },
    [patient, encounter, chargeItemsState, updateChargeItems, organizationId, close]
  );

  return (
    <Stack gap={0}>
      <Flex justify="space-between" align="center" mb="md">
        <Text fw={600} size="lg">
          Charge Items
        </Text>
        <Button leftSection={<IconPlus size={16} />} onClick={addChargeItem}>
          Add Charge Item
        </Button>
      </Flex>

      {chargeItems.length > 0 ? (
        <Stack gap="md">
          {chargeItems.map((chargeItem) => (
            <ChargeItemPanel
              key={chargeItem.id}
              chargeItem={chargeItem}
              onChange={updateChargeItemList}
              onDelete={deleteChargeItem}
            />
          ))}

          <Card withBorder shadow="sm">
            <Flex justify="space-between" align="center">
              <Text size="lg" fw={500}>
                Total Calculated Price to Bill
              </Text>
              <Box>
                <TextInput w={300} value={`$${calculateTotalPrice(chargeItems)}`} readOnly />
              </Box>
            </Flex>
          </Card>
        </Stack>
      ) : (
        <Card withBorder shadow="sm">
          <Stack gap="md" align="center">
            <Text c="dimmed">No charge items available</Text>
          </Stack>
        </Card>
      )}

      <AddChargeItemModal opened={opened} onClose={close} onSubmit={handleAddChargeItem} />
    </Stack>
  );
};

interface AddChargeItemModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (cptCode: string, cptDisplay: string, definitionCanonical: string) => void;
}

function AddChargeItemModal({ opened, onClose, onSubmit }: AddChargeItemModalProps): JSX.Element {
  const [cptCode, setCptCode] = useState('');
  const [cptDisplay, setCptDisplay] = useState('');
  const [definitionCanonical, setDefinitionCanonical] = useState('');

  const handleSubmit = useCallback(() => {
    onSubmit(cptCode, cptDisplay, definitionCanonical);
    // Clear all state
    setCptCode('');
    setCptDisplay('');
    setDefinitionCanonical('');
  }, [cptCode, cptDisplay, definitionCanonical, onSubmit]);

  const handleClose = useCallback(() => {
    // Clear all state
    setCptCode('');
    setCptDisplay('');
    setDefinitionCanonical('');
    onClose();
  }, [onClose]);

  return (
    <Modal opened={opened} onClose={handleClose} title="Add Charge Item" size="md">
      <Stack gap="md">
        <TextInput
          label="CPT Code"
          placeholder="Enter CPT code (e.g. 99213)"
          required
          value={cptCode}
          onChange={(e) => setCptCode(e.currentTarget.value)}
        />

        <TextInput
          label="CPT Code Display"
          placeholder="Enter description for the CPT code"
          value={cptDisplay}
          onChange={(e) => setCptDisplay(e.currentTarget.value)}
        />

        <TextInput
          label="Charge Item Definition URL"
          placeholder="Enter definition canonical URL (optional)"
          value={definitionCanonical}
          onChange={(e) => setDefinitionCanonical(e.currentTarget.value)}
        />

        <Flex justify="flex-end" gap="sm" mt="md">
          <Button variant="subtle" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!cptCode}>
            Add Charge Item
          </Button>
        </Flex>
      </Stack>
    </Modal>
  );
}
