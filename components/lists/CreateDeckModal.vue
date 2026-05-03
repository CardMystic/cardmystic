<template>
  <UModal v-model:open="isOpen" title="Create New Decklist">
    <template #content>
      <div class="p-4 space-y-4">
        <UFormField label="List Name">
          <UInput v-model="newListName" placeholder="Enter list name" class="w-full" />
        </UFormField>
        <UFormField label="Description (optional)">
          <UTextarea v-model="newListDescription" placeholder="Enter description" class="w-full" />
        </UFormField>
        <UFormField label="Format">
          <USelect v-model="newListFormat" :items="formatOptions" class="w-full" />
        </UFormField>
        <UFormField v-if="isCommanderFormat" label="Commander (optional)">
          <UInputMenu v-model="newListCommander" v-model:search-term="commanderSearchTerm" :items="filteredCommanders"
            placeholder="Search for a commander..." icon="i-lucide-crown" class="w-full" />
        </UFormField>
        <UFormField v-if="isCommanderFormat && showPartnerField" label="Partner Commander (optional)">
          <UInputMenu v-model="newListPartnerCommander" v-model:search-term="partnerSearchTerm"
            :items="filteredPartners" placeholder="Search for a partner commander..." icon="i-lucide-crown"
            class="w-full" />
        </UFormField>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="ghost" label="Cancel" @click="isOpen = false" :disabled="createLoading" />
          <UButton color="primary" variant="solid" label="Create" :loading="createLoading"
            :disabled="!newListName.trim()" @click="handleCreate" />
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { useCardLists } from '~/composables/useCardLists'
import { useCommanders, usePartnerCommanders } from '~/composables/useBulkData'
import { getPartnerType, getValidPartners } from '~/utils/partnerCommanders'
import { CardFormat, type CardFormatType } from '~/models/cardModel'
import { useToast } from '#imports'

const props = defineProps<{
  open: boolean
  cardIds?: string[]
  cardNames?: string[]
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'success': []
}>()

const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value),
})

const { createListMutation, addCardsToListMutation, addCardsByNameToListMutation } = useCardLists()
const { data: commanders } = useCommanders()
const { data: partnerCommanders } = usePartnerCommanders()
const toast = useToast()

const newListName = ref('')
const newListDescription = ref('')
const newListFormat = ref<CardFormatType>('Commander')
const newListCommander = ref('')
const newListPartnerCommander = ref('')
const commanderSearchTerm = ref('')
const partnerSearchTerm = ref('')
const createLoading = computed(() => createListMutation.isPending.value)

const formatOptions = CardFormat.options
const isCommanderFormat = computed(() => newListFormat.value === 'Commander')

// Determine which partner category the selected commander belongs to
const selectedCommanderPartnerType = computed(() => {
  if (!newListCommander.value || !partnerCommanders.value) return null
  return getPartnerType(newListCommander.value, partnerCommanders.value)
})

const showPartnerField = computed(() => !!selectedCommanderPartnerType.value)

// Valid partner options based on the selected commander's partner type
const validPartnerList = computed(() => {
  if (!partnerCommanders.value || !selectedCommanderPartnerType.value) return []
  return getValidPartners(selectedCommanderPartnerType.value, partnerCommanders.value)
})

// Filtered commander autocomplete
const filteredCommanders = computed(() => {
  if (!commanderSearchTerm.value || commanderSearchTerm.value.length < 2 || !commanders.value) return []
  const search = commanderSearchTerm.value.toLowerCase()
  return commanders.value.filter(c => c.toLowerCase().includes(search)).slice(0, 100)
})

// Filtered partner autocomplete
const filteredPartners = computed(() => {
  if (!partnerSearchTerm.value || partnerSearchTerm.value.length < 2) return []
  const search = partnerSearchTerm.value.toLowerCase()
  return validPartnerList.value
    .filter(c => c !== newListCommander.value && c.toLowerCase().includes(search))
    .slice(0, 100)
})

// Clear commander when format changes away from Commander
watch(newListFormat, (format) => {
  if (format !== 'Commander') {
    newListCommander.value = ''
    newListPartnerCommander.value = ''
    commanderSearchTerm.value = ''
    partnerSearchTerm.value = ''
  }
})

// Clear partner when commander changes
watch(newListCommander, () => {
  newListPartnerCommander.value = ''
  partnerSearchTerm.value = ''
})

// Reset form when modal closes
watch(isOpen, (opened) => {
  if (!opened) {
    newListName.value = ''
    newListDescription.value = ''
    newListFormat.value = 'Commander'
    newListCommander.value = ''
    newListPartnerCommander.value = ''
    commanderSearchTerm.value = ''
    partnerSearchTerm.value = ''
  }
})

const handleCreate = async () => {
  if (!newListName.value.trim()) return

  try {
    const commandersList: string[] = []
    if (newListCommander.value) commandersList.push(newListCommander.value)
    if (newListPartnerCommander.value) commandersList.push(newListPartnerCommander.value)

    const result = await createListMutation.mutateAsync({
      name: newListName.value.trim(),
      description: newListDescription.value.trim() || undefined,
      format: newListFormat.value,
      commanders: commandersList.length > 0 ? commandersList : undefined,
    })

    if (result?.id) {
      if (props.cardIds?.length) {
        await addCardsToListMutation.mutateAsync({ listId: result.id, cardIds: props.cardIds })
      } else if (props.cardNames?.length) {
        await addCardsByNameToListMutation.mutateAsync({ listId: result.id, cardNames: props.cardNames })
      }
    }

    const cardCount = (props.cardIds?.length ?? 0) || (props.cardNames?.length ?? 0)
    toast.add({
      title: cardCount > 0 ? `List created and ${cardCount} card${cardCount === 1 ? '' : 's'} added` : 'List created',
      icon: 'i-lucide-check'
    })
    emit('success')
    isOpen.value = false
  } catch (error: any) {
    toast.add({
      title: 'Error creating list',
      description: error.message,
      color: 'error'
    })
  }
}
</script>
