<template>
  <v-card
    variant="tonal"
    color="grey-lighten-4"
    class="mb-4 order-timeline-card"
  >
    <v-card-title class="text-subtitle-1 py-3">
      {{ title }}
    </v-card-title>

    <v-card-text class="pt-0">
      <div class="order-track-scroll">
        <div class="order-track" :style="trackWidthStyle">
          <div
            v-for="(step, index) in normalizedSteps"
            :key="step.id || `${step.code}-${index}`"
            class="track-step"
            :class="[
              animated ? { 'track-step--visible': index < visibleCount } : 'track-step--visible',
              getStepCodeClass(step),
            ]"
          >
            <div
              class="track-icon"
              :class="[
                `track-icon--${step.state}`,
                getStepIconClass(step),
              ]"
            >
              <v-icon size="22">{{ step.icon }}</v-icon>
            </div>

            <div
              class="track-connector"
              :class="[
                connectorClass(step),
                getConnectorCodeClass(step),
              ]"
              :style="connectorDelayStyle(index)"
            />

            <div class="track-label text-subtitle-2">
              {{ step.label }}
            </div>

            <div class="track-time text-caption text-medium-emphasis">
              {{ step.time || '-' }}
            </div>
          </div>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: {
    type: String,
    default: 'Lịch sử đơn hàng',
  },
  steps: {
    type: Array,
    default: () => [],
  },
  animated: {
    type: Boolean,
    default: false,
  },
  visibleCount: {
    type: Number,
    default: 999,
  },
  stepWidth: {
    type: Number,
    default: 190,
  },
})

const normalizedSteps = computed(() => {
  return Array.isArray(props.steps) ? props.steps : []
})

const normalizeStepCode = (code) => {
  return String(code || '')
    .toLowerCase()
    .replaceAll('_', '-')
}

const getStepCodeClass = (step) => {
  return `track-step--${normalizeStepCode(step?.code)}`
}

const getStepIconClass = (step) => {
  return `track-icon--code-${normalizeStepCode(step?.code)}`
}

const getConnectorCodeClass = (step) => {
  return `track-connector--code-${normalizeStepCode(step?.code)}`
}

const connectorClass = (step) => {
  if (!step) return 'track-connector--pending'
  if (step.state === 'done') return 'track-connector--done'
  if (step.state === 'current') return 'track-connector--current'
  if (step.state === 'cancelled') return 'track-connector--cancelled'
  if (step.state === 'returned') return 'track-connector--returned'
  return 'track-connector--pending'
}

const connectorDelayStyle = (index) => {
  return {
    transitionDelay: `${index * 0.18}s`,
  }
}

const trackWidthStyle = computed(() => {
  const count = Math.max(normalizedSteps.value.length, 1)
  return {
    minWidth: `${count * props.stepWidth}px`,
  }
})
</script>

<style scoped>
.order-timeline-card {
  border-radius: 12px;
}

.order-track-scroll {
  overflow-x: auto;
  padding: 8px 4px 24px;
}

.order-track {
  display: flex;
  gap: 0;
  padding-top: 14px;
  align-items: flex-start;
}

.track-step {
  position: relative;
  flex: 0 0 190px;
  min-width: 190px;
  text-align: center;
  opacity: 0;
  transform: translateY(10px) scale(0.97);
  transition: opacity 0.22s ease, transform 0.22s ease;
}

.track-step--visible {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.track-icon {
  --track-color: #00b80f;
  position: relative;
  z-index: 5;
  width: 64px;
  height: 64px;
  border-radius: 999px;
  margin: 0 auto 86px;
  display: grid;
  place-items: center;
  color: #fff !important;
  background: var(--track-color);
  border: 4px solid #fff;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.14);
}

.track-icon .v-icon {
  color: #fff !important;
}

.track-icon::after {
  content: "";
  position: absolute;
  left: 50%;
  top: 60px;
  width: 4px;
  height: 58px;
  transform: translateX(-50%);
  background: var(--track-color);
  z-index: -1;
}

.track-step::after {
  content: "";
  position: absolute;
  top: 126px;
  left: 50%;
  width: 11px;
  height: 11px;
  border-radius: 999px;
  background: #fff;
  transform: translateX(-50%);
  z-index: 6;
}

.track-connector {
  position: absolute;
  top: 118px;
  left: 0;
  width: 100%;
  height: 28px;
  opacity: 0;
  transform: scaleX(0.5);
  transform-origin: left center;
  transition: opacity 0.22s ease, transform 0.22s ease;
  z-index: 1;
  background: #00b80f;
  clip-path: polygon(
    0 0,
    calc(100% - 14px) 0,
    100% 50%,
    calc(100% - 14px) 100%,
    0 100%,
    14px 50%
  );
}

.track-step:first-child .track-connector {
  clip-path: polygon(
    0 0,
    calc(100% - 14px) 0,
    100% 50%,
    calc(100% - 14px) 100%,
    0 100%
  );
}

.track-step:last-child .track-connector {
  display: block;
  width: 100%;
}

.track-step--returned .track-connector,
.track-step--partial-returned .track-connector,
.track-connector--returned,
.track-connector--code-returned,
.track-connector--code-partial-returned {
  background: #ff3045 !important;
}

.track-icon--returned,
.track-icon--code-returned,
.track-icon--code-partial-returned {
  --track-color: #ff3045;
}

.track-step--visible .track-connector {
  opacity: 1;
  transform: scaleX(1);
}

.track-label {
  position: relative;
  z-index: 7;
  margin-top: 0;
  min-height: 24px;
  font-weight: 700;
  color: #333;
}

.track-time {
  position: relative;
  z-index: 7;
  margin-top: 6px;
  color: #6b7280;
}

/* =========================
   ICON COLOR
========================= */

.track-icon--done {
  --track-color: #00b80f;
}

.track-icon--current {
  --track-color: #ffc400;
}

.track-icon--pending {
  --track-color: #cfd8dc;
}

.track-icon--cancelled,
.track-icon--code-cancelled {
  --track-color: #ff3b30;
}

.track-icon--returned,
.track-icon--code-returned,
.track-icon--code-partial-returned {
  --track-color: #ff3045;
}

.track-icon--code-created,
.track-icon--code-wait-confirm,
.track-icon--code-confirm-order,
.track-icon--code-delivered,
.track-icon--code-completed {
  --track-color: #00b80f;
}

.track-icon--code-wait-ship,
.track-icon--code-transfer-confirm {
  --track-color: #ffc400;
}

.track-icon--code-shipping,
.track-icon--code-in-transit {
  --track-color: #ff8a00;
}

/* =========================
   CONNECTOR COLOR
========================= */

.track-connector--done {
  background: #00b80f;
}

.track-connector--current {
  background: #ffc400;
}

.track-connector--pending {
  background: #d9dee3;
}

.track-connector--cancelled,
.track-connector--code-cancelled {
  background: #ff3b30;
}

.track-connector--returned,
.track-connector--code-returned,
.track-connector--code-partial-returned {
  background: #ff3045;
}

.track-connector--code-created,
.track-connector--code-wait-confirm,
.track-connector--code-confirm-order,
.track-connector--code-delivered,
.track-connector--code-completed {
  background: #00b80f;
}

.track-connector--code-wait-ship,
.track-connector--code-transfer-confirm {
  background: #ffc400;
}

.track-connector--code-shipping,
.track-connector--code-in-transit {
  background: #ff8a00;
}

@media (max-width: 700px) {
  .track-step {
    flex-basis: 170px;
    min-width: 170px;
  }

  .track-icon {
    width: 56px;
    height: 56px;
    margin-bottom: 80px;
  }

  .track-icon::after {
    top: 54px;
    height: 58px;
  }

  .track-step::after {
    top: 118px;
  }

  .track-connector {
    top: 110px;
  }
}
</style>