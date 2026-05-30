<template>
  <div class="w-full">
    <!-- Toolbar: search + filters slot -->
    <div
      v-if="searchable || $slots.filters"
      class="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div v-if="searchable" class="relative w-full sm:max-w-xs">
        <MagnifyingGlassIcon
          class="pointer-events-none absolute left-3 top-1/2 -mt-2 h-4 w-4 text-gray-400"
          aria-hidden="true"
        />
        <input
          type="text"
          :value="internalSearch"
          :placeholder="searchPlaceholder"
          class="block w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:border-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-700"
          @input="onSearchInput"
        />
      </div>
      <div v-if="$slots.filters" class="flex flex-wrap items-center gap-2 sm:justify-end">
        <slot name="filters" />
      </div>
    </div>

    <!-- Table Container with Horizontal Scroll -->
    <div class="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 rounded-lg">
      <table class="min-w-full divide-y divide-gray-300">
        <!-- Table Header -->
        <thead class="bg-gray-50">
          <tr>
            <!-- Selection Checkbox Column -->
            <th v-if="selectable" scope="col" class="relative w-12 px-6 sm:w-16 sm:px-8">
              <input
                type="checkbox"
                class="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
                :checked="isAllSelected"
                :indeterminate="isIndeterminate"
                @change="toggleSelectAll"
              />
            </th>

            <!-- Data Columns -->
            <th
              v-for="column in columns"
              :key="column.key"
              scope="col"
              :style="{ width: column.width }"
              :class="[
                'px-3 py-3.5 text-sm font-semibold text-gray-900',
                column.align === 'center' && 'text-center',
                column.align === 'right' && 'text-right',
                column.align !== 'center' && column.align !== 'right' && 'text-left',
                sortable && column.sortable !== false && 'cursor-pointer select-none hover:bg-gray-100'
              ]"
              @click="sortable && column.sortable !== false && handleSort(column.key)"
            >
              <div class="flex items-center gap-2" :class="[
                column.align === 'center' && 'justify-center',
                column.align === 'right' && 'justify-end'
              ]">
                <span>{{ column.label }}</span>
                <!-- Sort Icons -->
                <span v-if="sortable && column.sortable !== false" class="flex flex-col">
                  <ChevronUpIcon
                    :class="[
                      'h-3 w-3 -mb-1',
                      sortColumn === column.key && sortDirection === 'asc'
                        ? 'text-blue-600'
                        : 'text-gray-400'
                    ]"
                  />
                  <ChevronDownIcon
                    :class="[
                      'h-3 w-3',
                      sortColumn === column.key && sortDirection === 'desc'
                        ? 'text-blue-600'
                        : 'text-gray-400'
                    ]"
                  />
                </span>
              </div>
            </th>
          </tr>
        </thead>

        <!-- Table Body -->
        <tbody class="divide-y divide-gray-200 bg-white">
          <!-- Loading State -->
          <template v-if="loading">
            <tr v-for="i in perPageValue" :key="`skeleton-${i}`">
              <td v-if="selectable" class="relative w-12 px-6 sm:w-16 sm:px-8">
                <AppSkeleton width="1rem" height="1rem" />
              </td>
              <td
                v-for="column in columns"
                :key="column.key"
                class="whitespace-nowrap px-3 py-4"
              >
                <AppSkeleton height="0.875rem" />
              </td>
            </tr>
          </template>

          <!-- Empty State -->
          <template v-else-if="displayedData.length === 0">
            <tr>
              <td :colspan="columns.length + (selectable ? 1 : 0)" class="px-3 py-12 text-center">
                <div class="text-gray-500">
                  <svg
                    class="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                    />
                  </svg>
                  <p class="mt-2 text-sm font-medium">{{ emptyMessage }}</p>
                </div>
              </td>
            </tr>
          </template>

          <!-- Data Rows -->
          <template v-else>
            <tr
              v-for="(row, index) in displayedData"
              :key="index"
              :class="[
                'hover:bg-gray-50 transition-colors',
                'cursor-pointer'
              ]"
              @click="handleRowClick(row, $event)"
            >
              <!-- Selection Checkbox -->
              <td v-if="selectable" class="relative w-12 px-6 sm:w-16 sm:px-8">
                <input
                  type="checkbox"
                  class="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
                  :checked="isRowSelected(row)"
                  @click.stop
                  @change="toggleRowSelection(row)"
                />
              </td>

              <!-- Data Cells -->
              <td
                v-for="column in columns"
                :key="column.key"
                :class="[
                  'whitespace-nowrap px-3 py-4 text-sm text-gray-900',
                  column.align === 'center' && 'text-center',
                  column.align === 'right' && 'text-right'
                ]"
              >
                <slot v-if="$slots[column.key]" :name="column.key" :row="row" :value="row[column.key]" />
                <template v-else>{{ getCellValue(row, column) }}</template>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="pagination && !loading && data.length > 0" class="mt-4">
      <AppPagination
        :current-page="pagination.currentPage"
        :total-pages="pagination.totalPages"
        :per-page="pagination.perPage"
        @page-change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts" generic="T extends Record<string, any>">
import { ref, computed, watch } from 'vue';
import { ChevronUpIcon, ChevronDownIcon, MagnifyingGlassIcon } from '@heroicons/vue/24/outline';
import type { TableColumn } from '@/types/common';
import AppPagination from '@/components/ui/AppPagination.vue';
import AppSkeleton from '@/components/ui/AppSkeleton.vue';

interface Props {
  columns: TableColumn[];
  data: T[];
  loading?: boolean;
  pagination?: {
    currentPage: number;
    totalPages: number;
    perPage: number;
    total: number;
  };
  sortable?: boolean;
  selectable?: boolean;
  emptyMessage?: string;
  defaultSortColumn?: string;
  defaultSortDirection?: 'asc' | 'desc';
  searchable?: boolean;
  searchPlaceholder?: string;
  searchQuery?: string;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  sortable: true,
  selectable: false,
  emptyMessage: 'Aucune donnée disponible',
  defaultSortColumn: '',
  defaultSortDirection: 'desc',
  searchable: false,
  searchPlaceholder: 'Rechercher...',
  searchQuery: undefined
});

const emit = defineEmits<{
  sort: [column: string, direction: 'asc' | 'desc'];
  'page-change': [page: number];
  'row-click': [row: T];
  'selection-change': [selected: T[]];
  'update:searchQuery': [value: string];
}>();

// Search state — controlled if parent provides searchQuery, else local.
const internalSearch = ref<string>(props.searchQuery ?? '');
watch(() => props.searchQuery, (v) => {
  if (typeof v === 'string' && v !== internalSearch.value) internalSearch.value = v;
});

const onSearchInput = (event: Event) => {
  const value = (event.target as HTMLInputElement).value;
  internalSearch.value = value;
  emit('update:searchQuery', value);
};

// Sorting State
const sortColumn = ref<string>(props.defaultSortColumn || '');
const sortDirection = ref<'asc' | 'desc'>(props.defaultSortDirection || 'desc');

// Selection State
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const selectedRows = ref<any[]>([]);

// Computed
const perPageValue = computed(() => props.pagination?.perPage || 10);

// Client-side sort fallback (used when parent doesn't handle @sort).
// If a default sort column is set and rows have the property, we sort locally.
const displayedData = computed(() => {
  let rows: T[] = props.data;

  // Local search filter — only when the parent does NOT control searchQuery.
  if (props.searchable && props.searchQuery === undefined && internalSearch.value.trim()) {
    const q = internalSearch.value.trim().toLowerCase();
    rows = rows.filter((row) =>
      Object.values(row as Record<string, unknown>).some((v) =>
        v != null && typeof v !== 'object' && String(v).toLowerCase().includes(q)
      )
    );
  }

  const col = sortColumn.value;
  if (!col) return rows;
  const sorted = [...rows];
  sorted.sort((a, b) => {
    const av = (a as Record<string, unknown>)[col];
    const bv = (b as Record<string, unknown>)[col];
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    let cmp = 0;
    if (typeof av === 'number' && typeof bv === 'number') cmp = av - bv;
    else cmp = String(av).localeCompare(String(bv));
    return sortDirection.value === 'asc' ? cmp : -cmp;
  });
  return sorted;
});

const isAllSelected = computed(() => {
  return props.data.length > 0 && selectedRows.value.length === props.data.length;
});

const isIndeterminate = computed(() => {
  return selectedRows.value.length > 0 && selectedRows.value.length < props.data.length;
});

// Methods
const handleSort = (columnKey: string) => {
  if (sortColumn.value === columnKey) {
    // Toggle direction
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
  } else {
    // New column, default to ascending
    sortColumn.value = columnKey;
    sortDirection.value = 'asc';
  }

  emit('sort', columnKey, sortDirection.value);
};

const handlePageChange = (page: number) => {
  emit('page-change', page);
};

const handleRowClick = (row: T, event: MouseEvent) => {
  // Don't emit row-click if clicking on checkbox
  const target = event.target as HTMLElement;
  if (target.tagName === 'INPUT' && target.getAttribute('type') === 'checkbox') {
    return;
  }

  emit('row-click', row);
};

const getCellValue = (row: T, column: TableColumn): string => {
  const value = row[column.key];

  // If column has custom render function, use it
  // Note: TableColumn interface doesn't have render function in types/common.ts
  // but we can check if it exists
  const columnWithRender = column as TableColumn & { render?: (value: unknown, row: unknown) => string };
  if (columnWithRender.render) {
    return columnWithRender.render(value, row);
  }

  // Default: convert value to string
  if (value === null || value === undefined) {
    return '-';
  }

  return String(value);
};

const isRowSelected = (row: T): boolean => {
  return selectedRows.value.some(selected => selected === row);
};

const toggleRowSelection = (row: T) => {
  const index = selectedRows.value.findIndex(selected => selected === row);

  if (index > -1) {
    selectedRows.value.splice(index, 1);
  } else {
    selectedRows.value.push(row);
  }

  emit('selection-change', selectedRows.value);
};

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedRows.value = [];
  } else {
    selectedRows.value = [...props.data];
  }

  emit('selection-change', selectedRows.value);
};
</script>
