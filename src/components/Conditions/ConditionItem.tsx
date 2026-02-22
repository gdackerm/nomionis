// SPDX-FileCopyrightText: Copyright Orangebot, Inc.
// SPDX-License-Identifier: Apache-2.0
import type { Tables } from '../../lib/supabase/types';
import { ActionIcon, Select, Group, Flex, Text } from '@mantine/core';
import { IconX } from '@tabler/icons-react';
import type { JSX } from 'react';

type Condition = Tables<'conditions'>;

interface ConditionItemProps {
  condition: Condition;
  rank: number;
  total: number;
  onChange?: (condition: Condition, value: string) => void;
  onRemove?: (condition: Condition) => void;
}

export default function ConditionItem(props: ConditionItemProps): JSX.Element {
  const { condition, rank, total, onChange, onRemove } = props;

  const displayText =
    condition.code_display ||
    (condition.code as any)?.coding?.[0]?.display ||
    '';

  return (
    <Flex justify="space-between">
      <Group>
        <Group>
          <Select
            w={80}
            value={rank.toString()}
            data={Array.from({ length: total }, (_, i) => (i + 1).toString())}
            onChange={(value) => {
              if (value) {
                onChange?.(condition, value);
              }
            }}
          />
          <Text>{displayText}</Text>
        </Group>
      </Group>
      <ActionIcon
        variant="subtle"
        color="gray"
        onClick={() => {
          onRemove?.(condition);
        }}
      >
        <IconX size={16} />
      </ActionIcon>
    </Flex>
  );
}
