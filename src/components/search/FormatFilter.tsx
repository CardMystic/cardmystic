import { Button } from "@/components/catalyst/button";
import {
  Combobox,
  ComboboxLabel,
  ComboboxOption,
} from "@/components/catalyst/combobox";
import { FieldGroup } from "@/components/catalyst/fieldset";
import { Select } from "@/components/catalyst/select";
import { CardFormat, CardFormatStatus } from "@/models/cardModel";
import type { SelectedCardFormats } from "@/models/searchModel";
import { XMarkIcon } from "@heroicons/react/24/outline";
import type { FC } from "react";

interface FormatFilterProps {
  selectedCardFormats: SelectedCardFormats;
  onChange: (formats: SelectedCardFormats) => void;
}

export const FormatFilter: FC<FormatFilterProps> = ({
  selectedCardFormats,
  onChange,
}) => {
  const handleStatusChange = (
    idx: number,
    status: (typeof CardFormatStatus.options)[number],
  ) => {
    const updated = [...selectedCardFormats];
    updated[idx] = { format: updated[idx]?.format ?? "", status };
    onChange(updated);
  };

  const handleFormatChange = (
    idx: number,
    format: (typeof CardFormat.options)[number],
  ) => {
    const updated = [...selectedCardFormats];
    updated[idx] = { format, status: updated[idx]?.status ?? "" };
    onChange(updated);
  };

  const handleRemove = (idx: number) => {
    const updated = selectedCardFormats.filter((_, i) => i !== idx);
    onChange(updated);
  };

  // Add a new empty row if the last row has either status or format selected
  const shouldAddNewRow = () => {
    if (selectedCardFormats.length === 0) return true;
    const lastRow = selectedCardFormats[selectedCardFormats.length - 1];
    return lastRow?.status || lastRow?.format;
  };

  // Ensure there's always at least one row available for input
  const displayRows = shouldAddNewRow()
    ? [...selectedCardFormats, { format: "", status: "" }]
    : selectedCardFormats;

  return (
    <FieldGroup>
      {displayRows.map((selected, idx) => {
        const isLastEmptyRow =
          idx === selectedCardFormats.length &&
          !selected.status &&
          !selected.format;
        const availableFormats = CardFormat.options.filter(
          (format) =>
            !selectedCardFormats.some(
              (f, i) => f.format === format && i !== idx,
            ),
        );

        const showClearButton = selected.status || selected.format;

        return (
          <div
            key={`${selected.format}-${selected.status}-${idx}`}
            className="flex items-center gap-3 mb-2"
          >
            <Select
              value={selected.status}
              onChange={(e) => {
                if (isLastEmptyRow) {
                  // Add new row to the actual array
                  onChange([
                    ...selectedCardFormats,
                    {
                      format: "",
                      status: e.target
                        .value as (typeof CardFormatStatus.options)[number],
                    },
                  ]);
                } else {
                  handleStatusChange(
                    idx,
                    e.target.value as (typeof CardFormatStatus.options)[number],
                  );
                }
              }}
              className="flex-1"
            >
              <option value="" disabled>
                Any Status
              </option>
              {CardFormatStatus.options.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </Select>

            <Combobox
              name="format"
              value={selected.format}
              options={availableFormats}
              displayValue={(format) => format || "Select Format"}
              aria-label="Select format"
              onChange={(format) => {
                if (isLastEmptyRow) {
                  // Add new row to the actual array
                  onChange([
                    ...selectedCardFormats,
                    {
                      format: format as (typeof CardFormat.options)[number],
                      status: "",
                    },
                  ]);
                } else {
                  handleFormatChange(
                    idx,
                    format as (typeof CardFormat.options)[number],
                  );
                }
              }}
              className="flex-[2]"
            >
              {(format) => (
                <ComboboxOption value={format}>
                  <ComboboxLabel>{format}</ComboboxLabel>
                </ComboboxOption>
              )}
            </Combobox>

            {showClearButton ? (
              <Button
                color="light"
                onClick={() => handleRemove(idx)}
                aria-label="Remove format filter"
                className="flex-shrink-0"
              >
                <XMarkIcon className="h-4 w-4" />
              </Button>
            ) : (
              <div className="w-[40px] flex-shrink-0" /> // Placeholder to maintain layout
            )}
          </div>
        );
      })}
    </FieldGroup>
  );
};
