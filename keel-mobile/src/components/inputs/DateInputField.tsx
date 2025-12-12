//keel-mobile/src/components/inputs/DateInputField.tsx

import React, { useMemo, useState, useEffect } from "react";
import { Platform, View, NativeModules } from "react-native";
import { TextInput, useTheme } from "react-native-paper";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";

type DatePart = "day" | "month" | "year";

type DatePattern = {
  order: DatePart[];
  separator: string;
};

type Props = {
  label: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  required?: boolean;
};

function getDeviceLocale(): string {
  if (Platform.OS === "ios") {
    return NativeModules.SettingsManager.settings.AppleLocale
      || NativeModules.SettingsManager.settings.AppleLanguages[0];
  }
  return NativeModules.I18nManager.localeIdentifier;
}

function getDatePattern(locale: string): DatePattern {
  const parts = new Intl.DateTimeFormat(locale).formatToParts(
    new Date(2000, 11, 31)
  );

  const order: DatePart[] = [];
  let separator = "-";

  for (const p of parts) {
    if (p.type === "day" || p.type === "month" || p.type === "year") {
      order.push(p.type);
    }
    if (p.type === "literal") {
      separator = p.value.trim() || "-";
    }
  }

  if (order.length !== 3) {
    return { order: ["day", "month", "year"], separator: "-" };
  }

  return { order, separator };
}

function placeholderFromPattern(pattern: DatePattern): string {
  const map: Record<DatePart, string> = {
    day: "DD",
    month: "MM",
    year: "YYYY",
  };

  return pattern.order.map(p => map[p]).join(pattern.separator);
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formatDate(date: Date, pattern: DatePattern) {
  const map: Record<DatePart, string> = {
    day: pad(date.getDate()),
    month: pad(date.getMonth() + 1),
    year: String(date.getFullYear()),
  };

  return pattern.order.map(p => map[p]).join(pattern.separator);
}

export default function DateInputField({
  label,
  value,
  onChange,
  required,
}: Props) {
  const theme = useTheme();
  const locale = useMemo(getDeviceLocale, []);
  const pattern = useMemo(() => getDatePattern(locale), [locale]);

  const [text, setText] = useState("");
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    if (value) {
      setText(formatDate(value, pattern));
    }
  }, [value, pattern]);

  const handlePickerChange = (
    event: DateTimePickerEvent,
    selected?: Date
  ) => {
    if (Platform.OS === "android") setShowPicker(false);
    if (event.type === "dismissed") return;

    if (selected) {
      onChange(selected);
      setText(formatDate(selected, pattern));
    }
  };

  return (
    <View>
      <TextInput
        mode="outlined"
        label={required ? `${label} *` : label}
        value={text}
        onChangeText={setText}
        placeholder={placeholderFromPattern(pattern)}
        keyboardType="number-pad"
        outlineColor={theme.colors.outline}
        activeOutlineColor={theme.colors.primary}
        right={
          <TextInput.Icon
            icon="calendar"
            onPress={() => setShowPicker(true)}
          />
        }
      />

      {showPicker && (
        <DateTimePicker
          value={value ?? new Date()}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handlePickerChange}
        />
      )}
    </View>
  );
}
