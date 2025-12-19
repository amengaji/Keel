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

/**
 * Safely detect device locale across iOS / Android.
 *
 * iPadOS NOTE:
 * - Some iPads do NOT expose SettingsManager at runtime.
 * - Direct access to AppleLocale can crash the app.
 *
 * This function guarantees a valid locale string
 * and NEVER throws.
 */
function getDeviceLocale(): string {
  try {
    // iOS — safest possible access
    if (Platform.OS === "ios") {
      const settings = NativeModules?.SettingsManager?.settings;

      if (settings?.AppleLocale) {
        return settings.AppleLocale;
      }

      if (
        Array.isArray(settings?.AppleLanguages) &&
        settings.AppleLanguages.length > 0
      ) {
        return settings.AppleLanguages[0];
      }
    }

    // Android
    if (Platform.OS === "android") {
      const locale = NativeModules?.I18nManager?.localeIdentifier;
      if (locale) return locale;
    }
  } catch (e) {
    // Absolute last-resort safety net
    console.warn("Locale detection failed, falling back to en-US");
  }

  // Final guaranteed fallback
  return "en-US";
}


function getDatePattern(locale: string): DatePattern {
  const parts = new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).formatToParts(new Date(2000, 11, 31));

  const order: DatePart[] = [];
  let separator = "-";

  parts.forEach((p) => {
    if (p.type === "day" || p.type === "month" || p.type === "year") {
      order.push(p.type);
    }
    if (p.type === "literal") {
      separator = p.value;
    }
  });

  return { order, separator };
}

function placeholderFromPattern(p: DatePattern) {
  const map = { day: "DD", month: "MM", year: "YYYY" };
  return p.order.map((o) => map[o]).join(p.separator);
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formatDate(date: Date, p: DatePattern) {
  const map = {
    day: pad(date.getDate()),
    month: pad(date.getMonth() + 1),
    year: String(date.getFullYear()),
  };
  return p.order.map((o) => map[o]).join(p.separator);
}

function extractDigits(text: string) {
  return text.replace(/\D/g, "").slice(0, 8);
}

function buildText(digits: string, p: DatePattern) {
  if (digits.length <= 2) return digits;
  if (digits.length <= 4)
    return `${digits.slice(0, 2)}${p.separator}${digits.slice(2)}`;
  return `${digits.slice(0, 2)}${p.separator}${digits.slice(
    2,
    4
  )}${p.separator}${digits.slice(4)}`;
}

function parseDate(digits: string, p: DatePattern): Date | null {
  if (digits.length !== 8) return null;

  const nums = [
    Number(digits.slice(0, 2)),
    Number(digits.slice(2, 4)),
    Number(digits.slice(4, 8)),
  ];

  const map: any = {};
  p.order.forEach((k, i) => (map[k] = nums[i]));

  const d = new Date(map.year, map.month - 1, map.day);
  return isNaN(d.getTime()) ? null : d;
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
    if (value) setText(formatDate(value, pattern));
  }, [value, pattern]);

  const handleChange = (t: string) => {
    const digits = extractDigits(t);
    const display = buildText(digits, pattern);
    setText(display);

    const parsed = parseDate(digits, pattern);
    if (parsed) onChange(parsed);
  };

  const handlePicker = (
    e: DateTimePickerEvent,
    selected?: Date
  ) => {
    if (Platform.OS === "android") setShowPicker(false);
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
        onChangeText={handleChange}
        keyboardType="number-pad"
        placeholder={placeholderFromPattern(pattern)}
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
        onChange={handlePicker}

        /**
         * iOS DARK MODE FIX
         * -----------------
         * iPad spinners are unreadable in dark mode unless
         * themeVariant is explicitly set.
         */
        themeVariant={theme.dark ? "dark" : "light"}
      />
    )}
    </View>
  );
}
