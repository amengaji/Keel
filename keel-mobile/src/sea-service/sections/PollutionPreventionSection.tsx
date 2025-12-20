//keel-mobile/src/sea-service/sections/PollutionPreventionSection.tsx

/**
 * ============================================================
 * Sea Service — Pollution Prevention / MARPOL (Annex I–VI)
 * ============================================================
 *
 * UI MODE: Annex-grouped (advanced)
 * - Collapsed by default (per user choice A)
 * - Draft-safe ALWAYS
 * - Wizard controls completion/status (NOT this file)
 * - Ship-type aware (tanker / chemical tanker conditional fields)
 */

import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import {
  Button,
  Divider,
  HelperText,
  List,
  Menu,
  Switch,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

import { useSeaService } from "../SeaServiceContext";
import { useToast } from "../../components/toast/useToast";

const SECTION_KEY = "POLLUTION_PREVENTION";

/* ============================================================
 * Helpers
 * ============================================================ */
const onlyNumber = (v: string) => v.replace(/[^\d]/g, "");
const hasText = (v: any) => typeof v === "string" && v.trim().length > 0;

function normalizeShipType(shipType?: string | null) {
  return String(shipType ?? "").toUpperCase();
}

function isTankerType(shipType?: string | null) {
  const t = normalizeShipType(shipType);
  return (
    t === "TANKER" ||
    t === "OIL_TANKER" ||
    t === "PRODUCT_TANKER" ||
    t === "CHEMICAL_TANKER" ||
    t === "GAS_TANKER"
  );
}

function isChemicalTanker(shipType?: string | null) {
  const t = normalizeShipType(shipType);
  return t === "CHEMICAL_TANKER";
}

function YesNoRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.switchRow}>
      <Text style={styles.switchLabel}>{label}</Text>
      <Switch value={!!value} onValueChange={onChange} />
    </View>
  );
}

/** Dropdown button with Menu (Paper-friendly, low-friction) */
function Dropdown({
  label,
  value,
  options,
  onPick,
}: {
  label: string;
  value: string;
  options: string[];
  onPick: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Menu
      visible={open}
      onDismiss={() => setOpen(false)}
      anchor={
        <Button
          mode="outlined"
          onPress={() => setOpen(true)}
          style={styles.menuButton}
        >
          {hasText(value) ? `${label}: ${value}` : `Select ${label}`}
        </Button>
      }
    >
      {options.map((opt) => (
        <Menu.Item
          key={opt}
          title={opt}
          onPress={() => {
            onPick(opt);
            setOpen(false);
          }}
        />
      ))}
    </Menu>
  );
}

export default function PollutionPreventionSection() {
  const theme = useTheme();
  const toast = useToast();
  const { payload, updateSection } = useSeaService();

  const shipType = payload?.shipType ?? null;
  const tanker = isTankerType(shipType);
  const chemical = isChemicalTanker(shipType);

  const existing =
    payload.sections?.[SECTION_KEY as keyof typeof payload.sections] || {};

  const [form, setForm] = useState<Record<string, any>>({});

  useEffect(() => {
    setForm({
      /* ---------------- Annex I — Oil ---------------- */
      annex1_owsFitted: existing.annex1_owsFitted ?? false,
      annex1_ppm15AlarmFitted: existing.annex1_ppm15AlarmFitted ?? false,
      annex1_bilgeSludgeTanksPresent:
        existing.annex1_bilgeSludgeTanksPresent ?? false,
      annex1_bilgeSludgeNotes: existing.annex1_bilgeSludgeNotes ?? "",
      annex1_oilRecordBookPartI: existing.annex1_oilRecordBookPartI ?? false,

      annex1_odmeFitted: existing.annex1_odmeFitted ?? false,
      annex1_slopTankArrangement:
        existing.annex1_slopTankArrangement ?? false,
      annex1_slopTankNotes: existing.annex1_slopTankNotes ?? "",
      annex1_cowCapable: existing.annex1_cowCapable ?? false,
      annex1_sopepSmpepOnboard:
        existing.annex1_sopepSmpepOnboard ?? false,

      /* ---------------- Annex II — NLS (chemical tankers) ---------------- */
      annex2_paManualOnboard: existing.annex2_paManualOnboard ?? false,
      annex2_cargoRecordBookOnboard:
        existing.annex2_cargoRecordBookOnboard ?? false,
      annex2_prewashSupported: existing.annex2_prewashSupported ?? false,
      annex2_prewashNotes: existing.annex2_prewashNotes ?? "",
      annex2_nlsDischargeAwareness:
        existing.annex2_nlsDischargeAwareness ?? false,

      /* ---------------- Annex III — IMDG / Packaged DG ---------------- */
      annex3_imdgDocsOnboard: existing.annex3_imdgDocsOnboard ?? false,
      annex3_cargoSecuringPlanAvailable:
        existing.annex3_cargoSecuringPlanAvailable ?? false,
      annex3_dgManifestProcedureUsed:
        existing.annex3_dgManifestProcedureUsed ?? false,
      annex3_dgManifestNotes: existing.annex3_dgManifestNotes ?? "",

      /* ---------------- Annex IV — Sewage ---------------- */
      annex4_stpFitted: existing.annex4_stpFitted ?? false,
      annex4_sewageHoldingTank: existing.annex4_sewageHoldingTank ?? false,
      annex4_shoreDischargeConnection:
        existing.annex4_shoreDischargeConnection ?? false,
      annex4_sewageDischargeNotes: existing.annex4_sewageDischargeNotes ?? "",

      /* ---------------- Annex V — Garbage ---------------- */
      annex5_garbageManagementPlan:
        existing.annex5_garbageManagementPlan ?? false,
      annex5_garbageRecordBook: existing.annex5_garbageRecordBook ?? false,
      annex5_placardsDisplayed: existing.annex5_placardsDisplayed ?? false,
      annex5_segregationBinsProvided:
        existing.annex5_segregationBinsProvided ?? false,
      annex5_foodWasteMethod: existing.annex5_foodWasteMethod ?? "",
      annex5_specialAreaAwareness:
        existing.annex5_specialAreaAwareness ?? false,

      /* ---------------- Annex VI — Air / Emissions ---------------- */
      annex6_iappCertificate: existing.annex6_iappCertificate ?? false,
      annex6_eiappNoxDocs: existing.annex6_eiappNoxDocs ?? false,
      annex6_fuelSulfurComplianceMethod:
        existing.annex6_fuelSulfurComplianceMethod ?? "",
      annex6_egcsFitted: existing.annex6_egcsFitted ?? false,
      annex6_egcsType: existing.annex6_egcsType ?? "",

      annex6_odsRecordBook: existing.annex6_odsRecordBook ?? false,
      annex6_incineratorFitted: existing.annex6_incineratorFitted ?? false,
      annex6_incineratorDetails: existing.annex6_incineratorDetails ?? "",
      annex6_seempOnboard: existing.annex6_seempOnboard ?? false,
      annex6_imoDcsInUse: existing.annex6_imoDcsInUse ?? false,
      annex6_ciiEexiTracking: existing.annex6_ciiEexiTracking ?? "Unknown",
    });
  }, []);

  const set = (k: string, v: any) =>
    setForm((p) => ({
      ...p,
      [k]: v,
    }));

  const hasAnyData = useMemo(() => {
    return Object.values(form).some((v) => {
      if (typeof v === "boolean") return v === true;
      return String(v ?? "").trim() !== "";
    });
  }, [form]);

  const save = () => {
    updateSection(SECTION_KEY as any, form);
    toast.info(
      hasAnyData
        ? "Pollution Prevention saved."
        : "Pollution Prevention saved (empty draft)."
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.container,
          { backgroundColor: theme.colors.background, paddingBottom: 120 },
        ]}
        enableOnAndroid
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={80}
        showsVerticalScrollIndicator={false}
      >
        <Text variant="headlineSmall" style={styles.title}>
          Pollution Prevention (MARPOL)
        </Text>

        <Text variant="bodyMedium" style={styles.subtitle}>
          Annex I–VI essentials for cadet record book + PSC sanity checks. Save
          anytime — partial data is acceptable.
        </Text>

        <Divider style={styles.divider} />

        {!hasText(shipType) ? (
          <HelperText type="info" visible>
            Ship type not selected yet. Tanker / chemical tanker annex fields
            will appear automatically once ship type is set.
          </HelperText>
        ) : (
          <HelperText type="info" visible>
            Ship type: <Text style={{ fontWeight: "700" }}>{String(shipType)}</Text>
            {tanker ? " (Tanker fields enabled)" : ""}
            {chemical ? " (Annex II enabled)" : ""}
          </HelperText>
        )}

        {/* ============================================================
            Annex I — Oil
           ============================================================ */}
        <List.Accordion title="Annex I — Oil (Machinery spaces + tankers)">
          <YesNoRow
            label="Oily Water Separator (OWS) fitted"
            value={!!form.annex1_owsFitted}
            onChange={(v) => set("annex1_owsFitted", v)}
          />
          <YesNoRow
            label="15 ppm bilge alarm fitted"
            value={!!form.annex1_ppm15AlarmFitted}
            onChange={(v) => set("annex1_ppm15AlarmFitted", v)}
          />
          <YesNoRow
            label="Oily bilge / sludge tanks present"
            value={!!form.annex1_bilgeSludgeTanksPresent}
            onChange={(v) => set("annex1_bilgeSludgeTanksPresent", v)}
          />
          {form.annex1_bilgeSludgeTanksPresent && (
            <TextInput
              label="Bilge / sludge tanks notes (optional)"
              value={form.annex1_bilgeSludgeNotes}
              onChangeText={(v) => set("annex1_bilgeSludgeNotes", v)}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
            />
          )}
          <YesNoRow
            label="Oil Record Book Part I onboard"
            value={!!form.annex1_oilRecordBookPartI}
            onChange={(v) => set("annex1_oilRecordBookPartI", v)}
          />

          {!tanker && (
            <HelperText type="info" visible>
              Tanker-only items will appear when ship type is a tanker.
            </HelperText>
          )}

          {tanker && (
            <>
              <Divider style={styles.innerDivider} />
              <Text style={styles.subHeading}>Tanker add-ons</Text>

              <YesNoRow
                label="ODME fitted"
                value={!!form.annex1_odmeFitted}
                onChange={(v) => set("annex1_odmeFitted", v)}
              />
              <YesNoRow
                label="Slop tank arrangement"
                value={!!form.annex1_slopTankArrangement}
                onChange={(v) => set("annex1_slopTankArrangement", v)}
              />
              {form.annex1_slopTankArrangement && (
                <TextInput
                  label="Slop tank notes (optional)"
                  value={form.annex1_slopTankNotes}
                  onChangeText={(v) => set("annex1_slopTankNotes", v)}
                  mode="outlined"
                  multiline
                  numberOfLines={3}
                  style={styles.input}
                />
              )}
              <YesNoRow
                label="COW capability (crude)"
                value={!!form.annex1_cowCapable}
                onChange={(v) => set("annex1_cowCapable", v)}
              />
              <YesNoRow
                label="SOPEP / SMPEP onboard"
                value={!!form.annex1_sopepSmpepOnboard}
                onChange={(v) => set("annex1_sopepSmpepOnboard", v)}
              />
            </>
          )}
        </List.Accordion>

        {/* ============================================================
            Annex II — NLS (Chemical tankers)
           ============================================================ */}
        <List.Accordion title="Annex II — Noxious Liquid Substances (Chemical tankers)">
          {!chemical ? (
            <HelperText type="info" visible>
              Annex II items are shown for Chemical Tanker ship type.
            </HelperText>
          ) : (
            <>
              <YesNoRow
                label="P&amp;A Manual onboard"
                value={!!form.annex2_paManualOnboard}
                onChange={(v) => set("annex2_paManualOnboard", v)}
              />
              <YesNoRow
                label="Cargo Record Book onboard"
                value={!!form.annex2_cargoRecordBookOnboard}
                onChange={(v) => set("annex2_cargoRecordBookOnboard", v)}
              />
              <YesNoRow
                label="Prewash required trades supported / capability"
                value={!!form.annex2_prewashSupported}
                onChange={(v) => set("annex2_prewashSupported", v)}
              />
              {form.annex2_prewashSupported && (
                <TextInput
                  label="Prewash notes (optional)"
                  value={form.annex2_prewashNotes}
                  onChangeText={(v) => set("annex2_prewashNotes", v)}
                  mode="outlined"
                  multiline
                  numberOfLines={3}
                  style={styles.input}
                />
              )}

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>
                  Acknowledgement: aware of NLS discharge restrictions
                </Text>
                <Switch
                  value={!!form.annex2_nlsDischargeAwareness}
                  onValueChange={(v) => set("annex2_nlsDischargeAwareness", v)}
                />
              </View>
            </>
          )}
        </List.Accordion>

        {/* ============================================================
            Annex III — IMDG (Packaged DG)
           ============================================================ */}
        <List.Accordion title="Annex III — Harmful substances in packaged form (IMDG)">
          <YesNoRow
            label="IMDG Code compliance docs onboard"
            value={!!form.annex3_imdgDocsOnboard}
            onChange={(v) => set("annex3_imdgDocsOnboard", v)}
          />
          <YesNoRow
            label="Cargo securing / stowage plan available"
            value={!!form.annex3_cargoSecuringPlanAvailable}
            onChange={(v) => set("annex3_cargoSecuringPlanAvailable", v)}
          />
          <YesNoRow
            label="DG manifest / DG declaration process used"
            value={!!form.annex3_dgManifestProcedureUsed}
            onChange={(v) => set("annex3_dgManifestProcedureUsed", v)}
          />
          {form.annex3_dgManifestProcedureUsed && (
            <TextInput
              label="DG process notes (optional)"
              value={form.annex3_dgManifestNotes}
              onChangeText={(v) => set("annex3_dgManifestNotes", v)}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
            />
          )}
        </List.Accordion>

        {/* ============================================================
            Annex IV — Sewage
           ============================================================ */}
        <List.Accordion title="Annex IV — Sewage">
          <YesNoRow
            label="Sewage Treatment Plant (STP) fitted"
            value={!!form.annex4_stpFitted}
            onChange={(v) => set("annex4_stpFitted", v)}
          />
          <YesNoRow
            label="Sewage holding tank"
            value={!!form.annex4_sewageHoldingTank}
            onChange={(v) => set("annex4_sewageHoldingTank", v)}
          />
          <YesNoRow
            label="International shore discharge connection"
            value={!!form.annex4_shoreDischargeConnection}
            onChange={(v) => set("annex4_shoreDischargeConnection", v)}
          />
          <TextInput
            label="Sewage discharge arrangement notes (optional)"
            value={form.annex4_sewageDischargeNotes}
            onChangeText={(v) => set("annex4_sewageDischargeNotes", v)}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={styles.input}
          />
        </List.Accordion>

        {/* ============================================================
            Annex V — Garbage
           ============================================================ */}
        <List.Accordion title="Annex V — Garbage">
          <YesNoRow
            label="Garbage Management Plan onboard"
            value={!!form.annex5_garbageManagementPlan}
            onChange={(v) => set("annex5_garbageManagementPlan", v)}
          />
          <YesNoRow
            label="Garbage Record Book onboard"
            value={!!form.annex5_garbageRecordBook}
            onChange={(v) => set("annex5_garbageRecordBook", v)}
          />
          <YesNoRow
            label="Placards displayed"
            value={!!form.annex5_placardsDisplayed}
            onChange={(v) => set("annex5_placardsDisplayed", v)}
          />
          <YesNoRow
            label="Segregation bins provided"
            value={!!form.annex5_segregationBinsProvided}
            onChange={(v) => set("annex5_segregationBinsProvided", v)}
          />

          <Dropdown
            label="Food waste handling method"
            value={String(form.annex5_foodWasteMethod ?? "")}
            options={["Macerator", "Landed ashore", "Other"]}
            onPick={(v) => set("annex5_foodWasteMethod", v)}
          />

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>
              Acknowledgement: aware of Special Area restrictions
            </Text>
            <Switch
              value={!!form.annex5_specialAreaAwareness}
              onValueChange={(v) => set("annex5_specialAreaAwareness", v)}
            />
          </View>
        </List.Accordion>

        {/* ============================================================
            Annex VI — Air / Emissions
           ============================================================ */}
        <List.Accordion title="Annex VI — Air pollution / emissions">
          <YesNoRow
            label="IAPP certificate onboard"
            value={!!form.annex6_iappCertificate}
            onChange={(v) => set("annex6_iappCertificate", v)}
          />
          <YesNoRow
            label="EIAPP / engine NOx compliance docs onboard"
            value={!!form.annex6_eiappNoxDocs}
            onChange={(v) => set("annex6_eiappNoxDocs", v)}
          />

          <Dropdown
            label="Fuel sulfur compliance method"
            value={String(form.annex6_fuelSulfurComplianceMethod ?? "")}
            options={["Compliant fuel", "Scrubber (EGCS)", "Other"]}
            onPick={(v) => set("annex6_fuelSulfurComplianceMethod", v)}
          />

          <YesNoRow
            label="EGCS (scrubber) fitted"
            value={!!form.annex6_egcsFitted}
            onChange={(v) => set("annex6_egcsFitted", v)}
          />
          {form.annex6_egcsFitted && (
            <Dropdown
              label="EGCS type"
              value={String(form.annex6_egcsType ?? "")}
              options={["Open", "Closed", "Hybrid"]}
              onPick={(v) => set("annex6_egcsType", v)}
            />
          )}

          <YesNoRow
            label="ODS record book onboard"
            value={!!form.annex6_odsRecordBook}
            onChange={(v) => set("annex6_odsRecordBook", v)}
          />

          <YesNoRow
            label="Incinerator fitted"
            value={!!form.annex6_incineratorFitted}
            onChange={(v) => set("annex6_incineratorFitted", v)}
          />
          {form.annex6_incineratorFitted && (
            <TextInput
              label="Incinerator type / model (optional)"
              value={form.annex6_incineratorDetails}
              onChangeText={(v) => set("annex6_incineratorDetails", v)}
              mode="outlined"
              style={styles.input}
            />
          )}

          <YesNoRow
            label="SEEMP onboard"
            value={!!form.annex6_seempOnboard}
            onChange={(v) => set("annex6_seempOnboard", v)}
          />
          <YesNoRow
            label="IMO DCS (fuel consumption data collection) in use"
            value={!!form.annex6_imoDcsInUse}
            onChange={(v) => set("annex6_imoDcsInUse", v)}
          />

          <Dropdown
            label="CII / EEXI tracking onboard"
            value={String(form.annex6_ciiEexiTracking ?? "Unknown")}
            options={["Yes", "No", "Unknown"]}
            onPick={(v) => set("annex6_ciiEexiTracking", v)}
          />
        </List.Accordion>

        <Divider style={styles.divider} />
      </KeyboardAwareScrollView>

      {/* Sticky Save Bar */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: theme.colors.background,
            borderTopColor: theme.colors.outlineVariant,
          },
        ]}
      >
        <Button mode="contained" onPress={save}>
          Save Section
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontWeight: "700", marginBottom: 6 },
  subtitle: { opacity: 0.8, marginBottom: 10 },

  divider: { marginVertical: 12 },
  innerDivider: { marginVertical: 10 },

  input: { marginTop: 10, marginBottom: 6 },
  menuButton: { alignSelf: "flex-start", marginTop: 10 },

  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 6,
  },
  switchLabel: { flex: 1, opacity: 0.95 },

  subHeading: { fontWeight: "700", marginBottom: 4, marginTop: 4 },

  bottomBar: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    borderTopWidth: 1,
  },
});
