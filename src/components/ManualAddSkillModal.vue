<script setup lang="ts">
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { parseManualSkillSource } from "../composables/utils";

const { t } = useI18n();

const props = defineProps<{
  show: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "submit", payload: { sourceUrl: string; name: string }): void;
}>();

const sourceUrl = ref("");
const skillName = ref("");
const errorMessage = ref("");

watch(
  () => props.show,
  (show) => {
    if (show) {
      sourceUrl.value = "";
      skillName.value = "";
      errorMessage.value = "";
    }
  }
);

function submit() {
  const parsed = parseManualSkillSource(sourceUrl.value);
  if (!parsed) {
    errorMessage.value = t("errors.unsupportedManualUrl");
    return;
  }

  const resolvedName = (skillName.value.trim() || parsed.inferredName || "").trim();
  if (!resolvedName) {
    errorMessage.value = t("errors.manualSkillNameRequired");
    return;
  }

  errorMessage.value = "";
  emit("submit", { sourceUrl: parsed.normalizedUrl, name: resolvedName });
  emit("close");
}
</script>

<template>
  <div v-if="show" class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal-title">{{ t("market.manualAddTitle") }}</div>

      <label class="field-label" for="manual-skill-url">{{ t("market.manualUrlLabel") }}</label>
      <input
        id="manual-skill-url"
        v-model="sourceUrl"
        class="input"
        :placeholder="t('market.manualUrlPlaceholder')"
        @keydown.enter.prevent="submit"
      />
      <div class="hint">{{ t("market.manualUrlHint") }}</div>

      <label class="field-label" for="manual-skill-name">{{ t("market.manualNameLabel") }}</label>
      <input
        id="manual-skill-name"
        v-model="skillName"
        class="input"
        :placeholder="t('market.manualNamePlaceholder')"
        @keydown.enter.prevent="submit"
      />
      <div class="hint">{{ t("market.manualNameHint") }}</div>

      <div v-if="errorMessage" class="message error">{{ errorMessage }}</div>

      <div class="modal-actions">
        <button class="ghost" @click="$emit('close')">{{ t("market.manualCancel") }}</button>
        <button class="primary" @click="submit">{{ t("market.manualSubmit") }}</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.field-label {
  display: block;
  margin: 12px 0 6px;
  font-size: 13px;
  font-weight: 600;
}
</style>
