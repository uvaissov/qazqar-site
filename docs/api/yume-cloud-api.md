# Yume Cloud CRM API Documentation

- **OpenAPI Version:** 3.0.3
- **API Version:** 1.3.1
- **Base URL:** `https://api.yume.cloud`
- **Authentication:** Basic Auth (`basicAuth`) / Cookie Auth (`cookieAuth` via `sessionid`)

> **Note:** The Authentication service (`/v1/auth/`) swagger docs returned 404 at time of generation.
> Raw OpenAPI JSON files are saved alongside this document.

---

## Table of Contents

- **Main CRM** (base: `/v1/crm/`) -- 70 endpoints, 140 schemas
- **Orders / Requests** (base: `/v1/crm/requests/`) -- 44 endpoints, 69 schemas
- **Documents** (base: `/v2/documents/`) -- 20 endpoints, 27 schemas

---

# Main CRM

**Base path:** `/v1/crm/`  
**Endpoints:** 70  
**Schemas:** 140

## Endpoint Summary

| Method | Path | Operation |
|--------|------|-----------|
| `GET` | `/v1/crm/clients/` | clients_list |
| `POST` | `/v1/crm/clients/` | clients_create |
| `GET` | `/v1/crm/clients/general/` | clients_general_retrieve |
| `POST` | `/v1/crm/clients/import/individual/` | clients_import_individual_create |
| `POST` | `/v1/crm/clients/import/legal/` | clients_import_legal_create |
| `GET` | `/v1/crm/clients/{client_id}/bonuses/` | clients_bonuses_list |
| `POST` | `/v1/crm/clients/{client_id}/bonuses/` | clients_bonuses_create |
| `DELETE` | `/v1/crm/clients/{client_id}/bonuses/{bonus_id}/` | clients_bonuses_destroy |
| `GET` | `/v1/crm/clients/{client_id}/passport/individual/` | clients_passport_individual_retrieve |
| `POST` | `/v1/crm/clients/{client_id}/passport/individual/` | clients_passport_individual_create |
| `PUT` | `/v1/crm/clients/{client_id}/passport/individual/` | clients_passport_individual_update |
| `PATCH` | `/v1/crm/clients/{client_id}/passport/individual/` | clients_passport_individual_partial_update |
| `DELETE` | `/v1/crm/clients/{client_id}/passport/individual/` | clients_passport_individual_destroy |
| `GET` | `/v1/crm/clients/{client_id}/passport/legal/` | clients_passport_legal_retrieve |
| `POST` | `/v1/crm/clients/{client_id}/passport/legal/` | clients_passport_legal_create |
| `PUT` | `/v1/crm/clients/{client_id}/passport/legal/` | clients_passport_legal_update |
| `PATCH` | `/v1/crm/clients/{client_id}/passport/legal/` | clients_passport_legal_partial_update |
| `DELETE` | `/v1/crm/clients/{client_id}/passport/legal/` | clients_passport_legal_destroy |
| `GET` | `/v1/crm/clients/{client_id}/popular_product/` | clients_popular_product_retrieve |
| `GET` | `/v1/crm/clients/{id}/` | clients_retrieve |
| `PUT` | `/v1/crm/clients/{id}/` | clients_update |
| `PATCH` | `/v1/crm/clients/{id}/` | clients_partial_update |
| `DELETE` | `/v1/crm/clients/{id}/` | clients_destroy |
| `POST` | `/v1/crm/converter/csv/` | converter_csv_create |
| `POST` | `/v1/crm/converter/id-card/` | converter_id_card_create |
| `POST` | `/v1/crm/converter/xlsx/` | converter_xlsx_create |
| `GET` | `/v1/crm/counterparties/` | counterparties_list |
| `POST` | `/v1/crm/counterparties/` | counterparties_create |
| `GET` | `/v1/crm/counterparties/{id}/` | counterparties_retrieve |
| `PUT` | `/v1/crm/counterparties/{id}/` | counterparties_update |
| `PATCH` | `/v1/crm/counterparties/{id}/` | counterparties_partial_update |
| `DELETE` | `/v1/crm/counterparties/{id}/` | counterparties_destroy |
| `GET` | `/v1/crm/disable/` | disable_list |
| `POST` | `/v1/crm/disable/` | disable_create |
| `GET` | `/v1/crm/groups/` | groups_list |
| `POST` | `/v1/crm/groups/` | groups_create |
| `POST` | `/v1/crm/groups/import/` | groups_import_create |
| `GET` | `/v1/crm/groups/states/` | groups_states_list |
| `GET` | `/v1/crm/groups/statuses/` | groups_statuses_list |
| `GET` | `/v1/crm/groups/{group_id}/tarifs/` | groups_tarifs_list |
| `POST` | `/v1/crm/groups/{group_id}/tarifs/` | groups_tarifs_create |
| `GET` | `/v1/crm/groups/{group_id}/tarifs/{tarif_id}/` | groups_tarifs_retrieve |
| `PUT` | `/v1/crm/groups/{group_id}/tarifs/{tarif_id}/` | groups_tarifs_update |
| `PATCH` | `/v1/crm/groups/{group_id}/tarifs/{tarif_id}/` | groups_tarifs_partial_update |
| `DELETE` | `/v1/crm/groups/{group_id}/tarifs/{tarif_id}/` | groups_tarifs_destroy |
| `GET` | `/v1/crm/groups/{id}/` | groups_retrieve |
| `PUT` | `/v1/crm/groups/{id}/` | groups_update |
| `PATCH` | `/v1/crm/groups/{id}/` | groups_partial_update |
| `DELETE` | `/v1/crm/groups/{id}/` | groups_destroy |
| `GET` | `/v1/crm/inventories/` | inventories_list |
| `POST` | `/v1/crm/inventories/` | inventories_create |
| `POST` | `/v1/crm/inventories/bulk_update/` | inventories_bulk_update_create |
| `GET` | `/v1/crm/inventories/distances/` | inventories_distances_list |
| `POST` | `/v1/crm/inventories/distances/` | inventories_distances_create |
| `GET` | `/v1/crm/inventories/general/` | inventories_general_retrieve |
| `POST` | `/v1/crm/inventories/import/` | inventories_import_create |
| `GET` | `/v1/crm/inventories/schedules/` | inventories_schedules_list |
| `GET` | `/v1/crm/inventories/schedules/boundaries/` | inventories_schedules_boundaries_retrieve |
| `POST` | `/v1/crm/inventories/sell/` | inventories_sell_create |
| `GET` | `/v1/crm/inventories/sets/` | inventories_sets_list |
| `POST` | `/v1/crm/inventories/sets/` | inventories_sets_create |
| `GET` | `/v1/crm/inventories/sets/general/` | inventories_sets_general_retrieve |
| `GET` | `/v1/crm/inventories/sets/{id}/` | inventories_sets_retrieve |
| `PUT` | `/v1/crm/inventories/sets/{id}/` | inventories_sets_update |
| `PATCH` | `/v1/crm/inventories/sets/{id}/` | inventories_sets_partial_update |
| `DELETE` | `/v1/crm/inventories/sets/{id}/` | inventories_sets_destroy |
| `GET` | `/v1/crm/inventories/sets/{set_id}/items/` | inventories_sets_items_list |
| `POST` | `/v1/crm/inventories/sets/{set_id}/items/` | inventories_sets_items_create |
| `PUT` | `/v1/crm/inventories/sets/{set_id}/items/{id}/` | inventories_sets_items_update |
| `PATCH` | `/v1/crm/inventories/sets/{set_id}/items/{id}/` | inventories_sets_items_partial_update |
| `DELETE` | `/v1/crm/inventories/sets/{set_id}/items/{id}/` | inventories_sets_items_destroy |
| `GET` | `/v1/crm/inventories/sets/{set_id}/prices/` | inventories_sets_prices_list |
| `POST` | `/v1/crm/inventories/sets/{set_id}/prices/` | inventories_sets_prices_create |
| `PUT` | `/v1/crm/inventories/sets/{set_id}/prices/{id}/` | inventories_sets_prices_update |
| `PATCH` | `/v1/crm/inventories/sets/{set_id}/prices/{id}/` | inventories_sets_prices_partial_update |
| `DELETE` | `/v1/crm/inventories/sets/{set_id}/prices/{id}/` | inventories_sets_prices_destroy |
| `GET` | `/v1/crm/inventories/sets/{set_id}/tarifs/` | inventories_sets_tarifs_list |
| `POST` | `/v1/crm/inventories/sets/{set_id}/tarifs/bulk_create/` | inventories_sets_tarifs_bulk_create_create |
| `POST` | `/v1/crm/inventories/sets/{set_id}/tarifs/bulk_update/` | inventories_sets_tarifs_bulk_update_create |
| `POST` | `/v1/crm/inventories/transfer/` | inventories_transfer_create |
| `GET` | `/v1/crm/inventories/unavailables/` | inventories_unavailables_list |
| `GET` | `/v1/crm/inventories/{id}/` | inventories_retrieve |
| `PUT` | `/v1/crm/inventories/{id}/` | inventories_update |
| `PATCH` | `/v1/crm/inventories/{id}/` | inventories_partial_update |
| `DELETE` | `/v1/crm/inventories/{id}/` | inventories_destroy |
| `GET` | `/v1/crm/inventories/{inventory_id}/general/` | inventories_general_retrieve_2 |
| `GET` | `/v1/crm/inventories/{inventory_id}/insurance/` | inventories_insurance_retrieve |
| `PUT` | `/v1/crm/inventories/{inventory_id}/insurance/` | inventories_insurance_update |
| `PATCH` | `/v1/crm/inventories/{inventory_id}/insurance/` | inventories_insurance_partial_update |
| `DELETE` | `/v1/crm/inventories/{inventory_id}/insurance/` | inventories_insurance_destroy |
| `GET` | `/v1/crm/inventories/{inventory_id}/tarifs/` | inventories_tarifs_list |
| `POST` | `/v1/crm/inventories/{inventory_id}/tarifs/` | inventories_tarifs_create |
| `GET` | `/v1/crm/inventories/{inventory_id}/tarifs/{id}/` | inventories_tarifs_retrieve |
| `PUT` | `/v1/crm/inventories/{inventory_id}/tarifs/{id}/` | inventories_tarifs_update |
| `PATCH` | `/v1/crm/inventories/{inventory_id}/tarifs/{id}/` | inventories_tarifs_partial_update |
| `DELETE` | `/v1/crm/inventories/{inventory_id}/tarifs/{id}/` | inventories_tarifs_destroy |
| `GET` | `/v1/crm/inventorizations/` | inventorizations_list |
| `POST` | `/v1/crm/inventorizations/` | inventorizations_create |
| `POST` | `/v1/crm/inventorizations/bulk_create/` | inventorizations_bulk_create_create |
| `GET` | `/v1/crm/inventorizations/states/` | inventorizations_states_list |
| `GET` | `/v1/crm/inventorizations/tasklist/` | inventorizations_tasklist_list |
| `POST` | `/v1/crm/inventorizations/tasklist/` | inventorizations_tasklist_create |
| `GET` | `/v1/crm/logs/` | logs_list |
| `GET` | `/v1/crm/logs/{id}/` | logs_retrieve |
| `GET` | `/v1/crm/maintenances/` | maintenances_list |
| `POST` | `/v1/crm/maintenances/` | maintenances_create |
| `GET` | `/v1/crm/maintenances/inventories/` | maintenances_inventories_list |
| `GET` | `/v1/crm/maintenances/tasklist/distance/` | maintenances_tasklist_distance_list |
| `GET` | `/v1/crm/maintenances/tasklist/interval/` | maintenances_tasklist_interval_list |
| `GET` | `/v1/crm/maintenances/{id}/` | maintenances_retrieve |
| `PUT` | `/v1/crm/maintenances/{id}/` | maintenances_update |
| `PATCH` | `/v1/crm/maintenances/{id}/` | maintenances_partial_update |
| `DELETE` | `/v1/crm/maintenances/{id}/` | maintenances_destroy |
| `POST` | `/v1/crm/maintenances/{id}/finish/` | maintenances_finish_create |
| `GET` | `/v1/crm/services/` | services_list |
| `POST` | `/v1/crm/services/` | services_create |
| `GET` | `/v1/crm/services/general/` | services_general_retrieve |
| `GET` | `/v1/crm/services/{id}/` | services_retrieve |
| `PUT` | `/v1/crm/services/{id}/` | services_update |
| `PATCH` | `/v1/crm/services/{id}/` | services_partial_update |
| `DELETE` | `/v1/crm/services/{id}/` | services_destroy |
| `DELETE` | `/v1/crm/services/{id}/archive` | services_archive_destroy |
| `POST` | `/v1/crm/services/{service_id}/tarifs/` | services_tarifs_create |
| `PUT` | `/v1/crm/services/{service_id}/tarifs/{id}/` | services_tarifs_update |
| `PATCH` | `/v1/crm/services/{service_id}/tarifs/{id}/` | services_tarifs_partial_update |
| `DELETE` | `/v1/crm/services/{service_id}/tarifs/{id}/` | services_tarifs_destroy |
| `GET` | `/v1/crm/tarifs/` | tarifs_list |
| `POST` | `/v1/crm/tarifs/` | tarifs_create |
| `POST` | `/v1/crm/tarifs/bulk_create/` | tarifs_bulk_create_create |
| `POST` | `/v1/crm/tarifs/bulk_update/` | tarifs_bulk_update_create |
| `GET` | `/v1/crm/tarifs/{id}/` | tarifs_retrieve |
| `PUT` | `/v1/crm/tarifs/{id}/` | tarifs_update |
| `PATCH` | `/v1/crm/tarifs/{id}/` | tarifs_partial_update |
| `DELETE` | `/v1/crm/tarifs/{id}/` | tarifs_destroy |

## Endpoint Details

### `GET` `/v1/crm/clients/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `attraction` | query | integer | No |  |
| `attraction__in` | query | array | No | Несколько значений могут быть разделены запятыми. |
| `deleted` | query | boolean | No |  |
| `individual_passport__iin` | query | string | No |  |
| `individual_passport__iin__icontains` | query | string | No |  |
| `legal_passport__bin` | query | string | No |  |
| `legal_passport__bin__icontains` | query | string | No |  |
| `legal_type` | query | integer | No | * `0` - ИП * `1` - ТОО * `2` - АО * `3` - ПК |
| `name` | query | string | No |  |
| `name__icontains` | query | string | No |  |
| `ordering` | query | string | No | Which field to use when ordering the results. |
| `page` | query | integer | No | A page number within the paginated result set. |
| `pageSize` | query | integer | No | Number of results to return per page. |
| `phone` | query | string | No |  |
| `phone__icontains` | query | string | No |  |
| `phone__in` | query | array | No | Несколько значений могут быть разделены запятыми. |
| `search` | query | string | No | A search term. |
| `signed` | query | boolean | No |  |
| `ticks` | query | array | No |  |
| `ticks__in` | query | array | No | Несколько значений могут быть разделены запятыми. |
| `type` | query | integer | No | * `0` - Физ. лицо * `1` - Юр. лицо |

**Response 200**: `PaginatedClientList`

---

### `POST` `/v1/crm/clients/`

**Request Body** (`application/json`): `ClientEdit`

**Response 201**: `ClientEdit`

---

### `GET` `/v1/crm/clients/general/`

**Response 200**: `ClientGeneral`

---

### `POST` `/v1/crm/clients/import/individual/`

**Request Body** (`application/json`): `IndividualClientImport`

**Response 201**: `IndividualClientImport`

---

### `POST` `/v1/crm/clients/import/legal/`

**Request Body** (`application/json`): `LegalClientImport`

**Response 201**: `LegalClientImport`

---

### `GET` `/v1/crm/clients/{client_id}/bonuses/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `client_id` | path | integer | Yes |  |
| `ordering` | query | string | No | Which field to use when ordering the results. |
| `page` | query | integer | No | A page number within the paginated result set. |
| `pageSize` | query | integer | No | Number of results to return per page. |
| `request` | query | integer | No |  |
| `search` | query | string | No | A search term. |
| `type` | query | integer | No | * `0` - transaction_spend * `1` - transaction_earn |

**Response 200**: `PaginatedBonusTransactionList`

---

### `POST` `/v1/crm/clients/{client_id}/bonuses/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `client_id` | path | integer | Yes |  |

**Request Body** (`application/json`): `BonusTransaction`

**Response 201**: `BonusTransaction`

---

### `DELETE` `/v1/crm/clients/{client_id}/bonuses/{bonus_id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `bonus_id` | path | integer | Yes |  |
| `client_id` | path | integer | Yes |  |

**Response 204**: No response body

---

### `GET` `/v1/crm/clients/{client_id}/passport/individual/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `client_id` | path | integer | Yes |  |

**Response 200**: `ClientPassportIndividual`

---

### `POST` `/v1/crm/clients/{client_id}/passport/individual/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `client_id` | path | integer | Yes |  |

**Request Body** (`application/json`): `ClientPassportIndividual`

**Response 200**: `ClientPassportIndividual`

---

### `PUT` `/v1/crm/clients/{client_id}/passport/individual/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `client_id` | path | integer | Yes |  |

**Request Body** (`application/json`): `ClientPassportIndividual`

**Response 200**: `ClientPassportIndividual`

---

### `PATCH` `/v1/crm/clients/{client_id}/passport/individual/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `client_id` | path | integer | Yes |  |

**Request Body** (`application/json`): `PatchedClientPassportIndividual`

**Response 200**: `ClientPassportIndividual`

---

### `DELETE` `/v1/crm/clients/{client_id}/passport/individual/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `client_id` | path | integer | Yes |  |

**Response 204**: No response body

---

### `GET` `/v1/crm/clients/{client_id}/passport/legal/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `client_id` | path | integer | Yes |  |

**Response 200**: `ClientPassportLegal`

---

### `POST` `/v1/crm/clients/{client_id}/passport/legal/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `client_id` | path | integer | Yes |  |

**Request Body** (`application/json`): `ClientPassportLegal`

**Response 200**: `ClientPassportLegal`

---

### `PUT` `/v1/crm/clients/{client_id}/passport/legal/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `client_id` | path | integer | Yes |  |

**Request Body** (`application/json`): `ClientPassportLegal`

**Response 200**: `ClientPassportLegal`

---

### `PATCH` `/v1/crm/clients/{client_id}/passport/legal/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `client_id` | path | integer | Yes |  |

**Request Body** (`application/json`): `PatchedClientPassportLegal`

**Response 200**: `ClientPassportLegal`

---

### `DELETE` `/v1/crm/clients/{client_id}/passport/legal/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `client_id` | path | integer | Yes |  |

**Response 204**: No response body

---

### `GET` `/v1/crm/clients/{client_id}/popular_product/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `client_id` | path | integer | Yes |  |

**Response 200**: `BaseInventoryGroup`

---

### `GET` `/v1/crm/clients/{id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `id` | path | integer | Yes |  |

**Response 200**: `Client`

---

### `PUT` `/v1/crm/clients/{id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `id` | path | integer | Yes |  |

**Request Body** (`application/json`): `ClientEdit`

**Response 200**: `ClientEdit`

---

### `PATCH` `/v1/crm/clients/{id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `id` | path | integer | Yes |  |

**Request Body** (`application/json`): `PatchedClientEdit`

**Response 200**: `ClientEdit`

---

### `DELETE` `/v1/crm/clients/{id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `id` | path | integer | Yes |  |

**Response 204**: No response body

---

### `POST` `/v1/crm/converter/csv/`

**Response 200**: No response body

---

### `POST` `/v1/crm/converter/id-card/`

**Response 200**: No response body

---

### `POST` `/v1/crm/converter/xlsx/`

**Response 200**: No response body

---

### `GET` `/v1/crm/counterparties/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `side` | query | integer | No | * `0` - self * `1` - foreign |

**Response 200**: `array[Counterparty]`

---

### `POST` `/v1/crm/counterparties/`

**Request Body** (`application/json`): `Counterparty`

**Response 201**: `Counterparty`

---

### `GET` `/v1/crm/counterparties/{id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `id` | path | integer | Yes |  |

**Response 200**: `Counterparty`

---

### `PUT` `/v1/crm/counterparties/{id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `id` | path | integer | Yes |  |

**Request Body** (`application/json`): `Counterparty`

**Response 200**: `Counterparty`

---

### `PATCH` `/v1/crm/counterparties/{id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `id` | path | integer | Yes |  |

**Request Body** (`application/json`): `PatchedCounterparty`

**Response 200**: `Counterparty`

---

### `DELETE` `/v1/crm/counterparties/{id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `id` | path | integer | Yes |  |

**Response 204**: No response body

---

### `GET` `/v1/crm/disable/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `category` | query | number | No |  |
| `created_at__date__gte` | query | string | No |  |
| `created_at__date__lte` | query | string | No |  |
| `created_by` | query | integer | No |  |
| `group` | query | number | No |  |
| `group__isnull` | query | boolean | No |  |
| `inventory` | query | integer | No |  |
| `inventory__in` | query | array | No | Несколько значений могут быть разделены запятыми. |
| `inventory__isnull` | query | boolean | No |  |
| `method` | query | integer | No | * `0` - delete * `1` - archive * `2` - withdraw |
| `ordering` | query | string | No | Which field to use when ordering the results. |
| `page` | query | integer | No | A page number within the paginated result set. |
| `pageSize` | query | integer | No | Number of results to return per page. |
| `rental_point` | query | number | No |  |
| `search` | query | string | No | A search term. |
| `service` | query | integer | No |  |
| `service__in` | query | array | No | Несколько значений могут быть разделены запятыми. |
| `service__isnull` | query | boolean | No |  |
| `set` | query | integer | No |  |
| `set__in` | query | array | No | Несколько значений могут быть разделены запятыми. |
| `set__isnull` | query | boolean | No |  |

**Response 200**: `PaginatedDisableListList`

---

### `POST` `/v1/crm/disable/`

**Request Body** (`application/json`): `DisableBulk`

**Response 201**: `DisableBulk`

---

### `GET` `/v1/crm/groups/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `end_at` | query | string | Yes |  |
| `ordering` | query | string | No | Which field to use when ordering the results. |
| `page` | query | integer | No | A page number within the paginated result set. |
| `pageSize` | query | integer | No | Number of results to return per page. |
| `search` | query | string | No | A search term. |
| `start_at` | query | string | Yes |  |

**Response 200**: `PaginatedInventoryGroupList`

---

### `POST` `/v1/crm/groups/`

**Request Body** (`application/json`): `InventoryGroupUpdate`

**Response 201**: `InventoryGroupUpdate`

---

### `POST` `/v1/crm/groups/import/`

**Request Body** (`application/json`): `InventoryGroupImport`

**Response 201**: `InventoryGroupImport`

---

### `GET` `/v1/crm/groups/states/`

**Response 200**: `array[InventoryGroupState]`

---

### `GET` `/v1/crm/groups/statuses/`

**Response 200**: `array[InventoryGroupStatus]`

---

### `GET` `/v1/crm/groups/{group_id}/tarifs/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `group_id` | path | integer | Yes |  |

**Response 200**: `array[InventoryGroupTarif]`

---

### `POST` `/v1/crm/groups/{group_id}/tarifs/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `group_id` | path | integer | Yes |  |

**Request Body** (`application/json`): `InventoryGroupTarif`

**Response 201**: `InventoryGroupTarif`

---

### `GET` `/v1/crm/groups/{group_id}/tarifs/{tarif_id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `group_id` | path | integer | Yes |  |
| `tarif_id` | path | integer | Yes |  |

**Response 200**: `InventoryGroupTarif`

---

### `PUT` `/v1/crm/groups/{group_id}/tarifs/{tarif_id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `group_id` | path | integer | Yes |  |
| `tarif_id` | path | integer | Yes |  |

**Request Body** (`application/json`): `InventoryGroupTarif`

**Response 200**: `InventoryGroupTarif`

---

### `PATCH` `/v1/crm/groups/{group_id}/tarifs/{tarif_id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `group_id` | path | integer | Yes |  |
| `tarif_id` | path | integer | Yes |  |

**Request Body** (`application/json`): `PatchedInventoryGroupTarif`

**Response 200**: `InventoryGroupTarif`

---

### `DELETE` `/v1/crm/groups/{group_id}/tarifs/{tarif_id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `group_id` | path | integer | Yes |  |
| `tarif_id` | path | integer | Yes |  |

**Response 204**: No response body

---

### `GET` `/v1/crm/groups/{id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `end_at` | query | string | Yes |  |
| `id` | path | integer | Yes |  |
| `start_at` | query | string | Yes |  |

**Response 200**: `InventoryGroupDetail`

---

### `PUT` `/v1/crm/groups/{id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `id` | path | integer | Yes |  |

**Request Body** (`application/json`): `InventoryGroupUpdate`

**Response 200**: `InventoryGroupUpdate`

---

### `PATCH` `/v1/crm/groups/{id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `id` | path | integer | Yes |  |

**Request Body** (`application/json`): `PatchedInventoryGroupUpdate`

**Response 200**: `InventoryGroupUpdate`

---

### `DELETE` `/v1/crm/groups/{id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `id` | path | integer | Yes |  |

**Response 204**: No response body

---

### `GET` `/v1/crm/inventories/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `car__isnull` | query | boolean | No |  |
| `category` | query | integer | No |  |
| `category__in` | query | array | No | Несколько значений могут быть разделены запятыми. |
| `disable__isnull` | query | boolean | No |  |
| `disable__method` | query | integer | No | * `0` - delete * `1` - archive * `2` - withdraw |
| `disabled` | query | boolean | No |  |
| `end_at` | query | string | Yes |  |
| `exclude_ids` | query | array | No | Несколько значений могут быть разделены запятыми. |
| `filter_key` | query | string | No |  |
| `free` | query | boolean | No |  |
| `group` | query | integer | No |  |
| `group__in` | query | array | No | Несколько значений могут быть разделены запятыми. |
| `has_sublease` | query | boolean | No |  |
| `id` | query | integer | No |  |
| `id__in` | query | array | No | Несколько значений могут быть разделены запятыми. |
| `ordering` | query | string | No | Which field to use when ordering the results. |
| `page` | query | integer | No | A page number within the paginated result set. |
| `pageSize` | query | integer | No | Number of results to return per page. |
| `rental_point` | query | integer | No |  |
| `rental_point__in` | query | array | No | Несколько значений могут быть разделены запятыми. |
| `request` | query | number | No |  |
| `saleable` | query | boolean | No |  |
| `search` | query | string | No | A search term. |
| `start_at` | query | string | Yes |  |
| `state` | query | integer | No |  |
| `state__in` | query | array | No | Несколько значений могут быть разделены запятыми. |
| `status` | query | number | No |  |
| `sublease_user` | query | integer | No |  |
| `sublease_user__in` | query | array | No | Несколько значений могут быть разделены запятыми. |
| `sublease_user__isnull` | query | boolean | No |  |
| `type` | query | number | No |  |
| `unique_id` | query | string | No |  |
| `unique_id__in` | query | array | No | Несколько значений могут быть разделены запятыми. |

**Response 200**: `PaginatedInventoryList`

---

### `POST` `/v1/crm/inventories/`

**Request Body** (`application/json`): `InventoryEdit`

**Response 201**: `InventoryEdit`

---

### `POST` `/v1/crm/inventories/bulk_update/`

**Request Body** (`application/json`): `InventoryBulkUpdate`

**Response 201**: `InventoryBulkUpdate`

---

### `GET` `/v1/crm/inventories/distances/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `created_at__date__gte` | query | string | No |  |
| `created_at__date__lte` | query | string | No |  |
| `inventory` | query | integer | No |  |
| `inventory__category` | query | integer | No |  |
| `inventory__category__in` | query | array | No | Несколько значений могут быть разделены запятыми. |
| `inventory__group` | query | integer | No |  |
| `inventory__group__in` | query | array | No | Несколько значений могут быть разделены запятыми. |
| `inventory__in` | query | array | No | Несколько значений могут быть разделены запятыми. |
| `inventory__state` | query | integer | No |  |
| `inventory__state__in` | query | array | No | Несколько значений могут быть разделены запятыми. |
| `inventory__sublease_user` | query | integer | No |  |
| `inventory__sublease_user__in` | query | array | No | Несколько значений могут быть разделены запятыми. |
| `ordering` | query | string | No | Which field to use when ordering the results. |
| `page` | query | integer | No | A page number within the paginated result set. |
| `pageSize` | query | integer | No | Number of results to return per page. |
| `search` | query | string | No | A search term. |

**Response 200**: `PaginatedInventoryDistanceList`

---

### `POST` `/v1/crm/inventories/distances/`

**Request Body** (`application/json`): `InventoryDistance`

**Response 201**: `InventoryDistance`

---

### `GET` `/v1/crm/inventories/general/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `end_at` | query | string | Yes |  |
| `start_at` | query | string | Yes |  |

**Response 200**: `InventoryGeneral`

---

### `POST` `/v1/crm/inventories/import/`

**Request Body** (`application/json`): `InventoryImport`

**Response 201**: `InventoryImport`

---

### `GET` `/v1/crm/inventories/schedules/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `end_at` | query | string | Yes |  |
| `page` | query | integer | No | A page number within the paginated result set. |
| `pageSize` | query | integer | No | Number of results to return per page. |
| `search` | query | string | No | A search term. |
| `start_at` | query | string | Yes |  |

**Response 200**: `PaginatedInventoryScheduleList`

---

### `GET` `/v1/crm/inventories/schedules/boundaries/`

**Response 200**: `InventoryScheduleMinMax`

---

### `POST` `/v1/crm/inventories/sell/`

**Request Body** (`application/json`): `InventorySell`

**Response 201**: `InventorySell`

---

### `GET` `/v1/crm/inventories/sets/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `end_at` | query | string | Yes |  |
| `ordering` | query | string | No | Which field to use when ordering the results. |
| `page` | query | integer | No | A page number within the paginated result set. |
| `pageSize` | query | integer | No | Number of results to return per page. |
| `search` | query | string | No | A search term. |
| `start_at` | query | string | Yes |  |

**Response 200**: `PaginatedInventorySetList`

---

### `POST` `/v1/crm/inventories/sets/`

**Request Body** (`application/json`): `InventorySet`

**Response 201**: `InventorySet`

---

### `GET` `/v1/crm/inventories/sets/general/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `end_at` | query | string | Yes |  |
| `start_at` | query | string | Yes |  |

**Response 200**: `InventorySetGeneral`

---

### `GET` `/v1/crm/inventories/sets/{id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `end_at` | query | string | Yes |  |
| `id` | path | integer | Yes |  |
| `start_at` | query | string | Yes |  |

**Response 200**: `InventorySet`

---

### `PUT` `/v1/crm/inventories/sets/{id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `id` | path | integer | Yes |  |

**Request Body** (`application/json`): `InventorySet`

**Response 200**: `InventorySet`

---

### `PATCH` `/v1/crm/inventories/sets/{id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `id` | path | integer | Yes |  |

**Request Body** (`application/json`): `PatchedInventorySet`

**Response 200**: `InventorySet`

---

### `DELETE` `/v1/crm/inventories/sets/{id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `id` | path | integer | Yes |  |

**Response 204**: No response body

---

### `GET` `/v1/crm/inventories/sets/{set_id}/items/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `end_at` | query | string | Yes |  |
| `set_id` | path | integer | Yes |  |
| `start_at` | query | string | Yes |  |

**Response 200**: `array[InventorySetItem]`

---

### `POST` `/v1/crm/inventories/sets/{set_id}/items/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `set_id` | path | integer | Yes |  |

**Request Body** (`application/json`): `InventorySetItem`

**Response 201**: `InventorySetItem`

---

### `PUT` `/v1/crm/inventories/sets/{set_id}/items/{id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `id` | path | integer | Yes |  |
| `set_id` | path | integer | Yes |  |

**Request Body** (`application/json`): `InventorySetItem`

**Response 200**: `InventorySetItem`

---

### `PATCH` `/v1/crm/inventories/sets/{set_id}/items/{id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `id` | path | integer | Yes |  |
| `set_id` | path | integer | Yes |  |

**Request Body** (`application/json`): `PatchedInventorySetItem`

**Response 200**: `InventorySetItem`

---

### `DELETE` `/v1/crm/inventories/sets/{set_id}/items/{id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `id` | path | integer | Yes |  |
| `set_id` | path | integer | Yes |  |

**Response 204**: No response body

---

### `GET` `/v1/crm/inventories/sets/{set_id}/prices/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `set_id` | path | integer | Yes |  |

**Response 200**: `array[InventorySetPriceSerializerV2]`

---

### `POST` `/v1/crm/inventories/sets/{set_id}/prices/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `set_id` | path | integer | Yes |  |

**Request Body** (`application/json`): `InventorySetPriceSerializerV2`

**Response 201**: `InventorySetPriceSerializerV2`

---

### `PUT` `/v1/crm/inventories/sets/{set_id}/prices/{id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `id` | path | integer | Yes |  |
| `set_id` | path | integer | Yes |  |

**Request Body** (`application/json`): `InventorySetPriceSerializerV2`

**Response 200**: `InventorySetPriceSerializerV2`

---

### `PATCH` `/v1/crm/inventories/sets/{set_id}/prices/{id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `id` | path | integer | Yes |  |
| `set_id` | path | integer | Yes |  |

**Request Body** (`application/json`): `PatchedInventorySetPriceSerializerV2`

**Response 200**: `InventorySetPriceSerializerV2`

---

### `DELETE` `/v1/crm/inventories/sets/{set_id}/prices/{id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `id` | path | integer | Yes |  |
| `set_id` | path | integer | Yes |  |

**Response 204**: No response body

---

### `GET` `/v1/crm/inventories/sets/{set_id}/tarifs/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `set_id` | path | integer | Yes |  |

**Response 200**: `array[InventorySetPriceTarif]`

---

### `POST` `/v1/crm/inventories/sets/{set_id}/tarifs/bulk_create/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `set_id` | path | integer | Yes |  |

**Request Body** (`application/json`): `InventorySetTarifBulkCreate`

**Response 201**: `InventorySetTarifBulkCreate`

---

### `POST` `/v1/crm/inventories/sets/{set_id}/tarifs/bulk_update/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `set_id` | path | integer | Yes |  |

**Request Body** (`application/json`): `InventorySetTarifBulkUpdate`

**Response 201**: `InventorySetTarifBulkUpdate`

---

### `POST` `/v1/crm/inventories/transfer/`

**Request Body** (`application/json`): `InventoryTransfer`

**Response 201**: `InventoryTransfer`

---

### `GET` `/v1/crm/inventories/unavailables/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `end_at` | query | string | Yes |  |
| `request` | query | integer | No |  |
| `start_at` | query | string | Yes |  |

**Response 200**: `array[Unavailable]`

---

### `GET` `/v1/crm/inventories/{id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `id` | path | integer | Yes |  |

**Response 200**: `Inventory`

---

### `PUT` `/v1/crm/inventories/{id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `id` | path | integer | Yes |  |

**Request Body** (`application/json`): `InventoryEdit`

**Response 200**: `InventoryEdit`

---

### `PATCH` `/v1/crm/inventories/{id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `id` | path | integer | Yes |  |

**Request Body** (`application/json`): `PatchedInventoryEdit`

**Response 200**: `InventoryEdit`

---

### `DELETE` `/v1/crm/inventories/{id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `id` | path | integer | Yes |  |

**Response 204**: No response body

---

### `GET` `/v1/crm/inventories/{inventory_id}/general/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `inventory_id` | path | integer | Yes |  |

**Response 200**: `InventoryDetailGeneral`

---

### `GET` `/v1/crm/inventories/{inventory_id}/insurance/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `inventory_id` | path | integer | Yes |  |

**Response 200**: `InventoryInsurance`

---

### `PUT` `/v1/crm/inventories/{inventory_id}/insurance/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `inventory_id` | path | integer | Yes |  |

**Request Body** (`application/json`): `InventoryInsurance`

**Response 200**: `InventoryInsurance`

---

### `PATCH` `/v1/crm/inventories/{inventory_id}/insurance/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `inventory_id` | path | integer | Yes |  |

**Request Body** (`application/json`): `PatchedInventoryInsurance`

**Response 200**: `InventoryInsurance`

---

### `DELETE` `/v1/crm/inventories/{inventory_id}/insurance/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `inventory_id` | path | integer | Yes |  |

**Response 204**: No response body

---

### `GET` `/v1/crm/inventories/{inventory_id}/tarifs/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `inventory_id` | path | integer | Yes |  |

**Response 200**: `array[InventoryTarif]`

---

### `POST` `/v1/crm/inventories/{inventory_id}/tarifs/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `inventory_id` | path | integer | Yes |  |

**Request Body** (`application/json`): `InventoryTarif`

**Response 201**: `InventoryTarif`

---

### `GET` `/v1/crm/inventories/{inventory_id}/tarifs/{id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `id` | path | integer | Yes |  |
| `inventory_id` | path | integer | Yes |  |

**Response 200**: `InventoryTarif`

---

### `PUT` `/v1/crm/inventories/{inventory_id}/tarifs/{id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `id` | path | integer | Yes |  |
| `inventory_id` | path | integer | Yes |  |

**Request Body** (`application/json`): `InventoryTarif`

**Response 200**: `InventoryTarif`

---

### `PATCH` `/v1/crm/inventories/{inventory_id}/tarifs/{id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `id` | path | integer | Yes |  |
| `inventory_id` | path | integer | Yes |  |

**Request Body** (`application/json`): `PatchedInventoryTarif`

**Response 200**: `InventoryTarif`

---

### `DELETE` `/v1/crm/inventories/{inventory_id}/tarifs/{id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `id` | path | integer | Yes |  |
| `inventory_id` | path | integer | Yes |  |

**Response 204**: No response body

---

### `GET` `/v1/crm/inventorizations/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `created_at__date__gte` | query | string | No |  |
| `created_at__date__lte` | query | string | No |  |
| `created_by` | query | integer | No |  |
| `created_by__in` | query | array | No | Несколько значений могут быть разделены запятыми. |
| `inventory` | query | integer | No |  |
| `inventory__group` | query | integer | No |  |
| `inventory__group__in` | query | array | No | Несколько значений могут быть разделены запятыми. |
| `inventory__in` | query | array | No | Несколько значений могут быть разделены запятыми. |
| `inventory__rental_point` | query | integer | No |  |
| `inventory__rental_point__in` | query | array | No | Несколько значений могут быть разделены запятыми. |
| `ordering` | query | string | No | Which field to use when ordering the results. |
| `page` | query | integer | No | A page number within the paginated result set. |
| `pageSize` | query | integer | No | Number of results to return per page. |
| `prev` | query | number | No |  |
| `request` | query | integer | No |  |
| `search` | query | string | No | A search term. |
| `state` | query | integer | No |  |
| `state__in` | query | array | No | Несколько значений могут быть разделены запятыми. |

**Response 200**: `PaginatedInventorizationDetailList`

---

### `POST` `/v1/crm/inventorizations/`

**Request Body** (`application/json`): `InventorizationCreate`

**Response 201**: `InventorizationCreate`

---

### `POST` `/v1/crm/inventorizations/bulk_create/`

**Request Body** (`application/json`): `InventorizationBulkCreate`

**Response 201**: `InventorizationBulkCreate`

---

### `GET` `/v1/crm/inventorizations/states/`

**Response 200**: `array[InventoryStateDetail]`

---

### `GET` `/v1/crm/inventorizations/tasklist/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `ordering` | query | string | No | Which field to use when ordering the results. |
| `page` | query | integer | No | A page number within the paginated result set. |
| `pageSize` | query | integer | No | Number of results to return per page. |
| `search` | query | string | No | A search term. |

**Response 200**: `PaginatedInventorizationTasklistList`

---

### `POST` `/v1/crm/inventorizations/tasklist/`

**Request Body** (`application/json`): `InventorizationTasklist`

**Response 201**: `InventorizationTasklist`

---

### `GET` `/v1/crm/logs/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `action` | query | integer | No |  |
| `action_in` | query | integer | No |  |
| `actor` | query | integer | No |  |
| `object_id` | query | integer | No |  |
| `ordering` | query | string | No | Which field to use when ordering the results. |
| `page` | query | integer | No | A page number within the paginated result set. |
| `pageSize` | query | integer | No | Number of results to return per page. |
| `search` | query | string | No | A search term. |
| `timestamp` | query | string | No |  |
| `timestamp_gte` | query | string | No |  |
| `timestamp_lte` | query | string | No |  |

**Response 200**: `PaginatedLogEntryList`

---

### `GET` `/v1/crm/logs/{id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `id` | path | integer | Yes |  |

**Response 200**: `LogEntry`

---

### `GET` `/v1/crm/maintenances/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `fact_maintenance_date__date__gte` | query | string | No |  |
| `fact_maintenance_date__date__lte` | query | string | No |  |
| `fact_maintenance_date__isnull` | query | boolean | No |  |
| `id` | query | integer | No |  |
| `id__in` | query | array | No | Несколько значений могут быть разделены запятыми. |
| `inventory` | query | integer | No |  |
| `inventory__category` | query | integer | No |  |
| `inventory__category__in` | query | array | No | Несколько значений могут быть разделены запятыми. |
| `inventory__group` | query | integer | No |  |
| `inventory__group__in` | query | array | No | Несколько значений могут быть разделены запятыми. |
| `inventory__in` | query | array | No | Несколько значений могут быть разделены запятыми. |
| `maintenance_date__date__gte` | query | string | No |  |
| `maintenance_date__date__lte` | query | string | No |  |
| `ordering` | query | string | No | Which field to use when ordering the results. |
| `page` | query | integer | No | A page number within the paginated result set. |
| `pageSize` | query | integer | No | Number of results to return per page. |
| `period_type` | query | integer | No | * `0` - interval * `1` - distance |
| `responsible` | query | integer | No |  |
| `responsible__in` | query | array | No | Несколько значений могут быть разделены запятыми. |
| `search` | query | string | No | A search term. |
| `state` | query | integer | No |  |
| `state__in` | query | array | No | Несколько значений могут быть разделены запятыми. |
| `state__isnull` | query | boolean | No |  |
| `type` | query | integer | No | * `0` - one time * `1` - periodic |

**Response 200**: `PaginatedInventoryMaintenanceList`

---

### `POST` `/v1/crm/maintenances/`

**Request Body** (`application/json`): `BaseInventoryMaintenance`

**Response 201**: `BaseInventoryMaintenance`

---

### `GET` `/v1/crm/maintenances/inventories/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `category` | query | integer | No |  |
| `category__in` | query | array | No | Несколько значений могут быть разделены запятыми. |
| `group` | query | integer | No |  |
| `group__in` | query | array | No | Несколько значений могут быть разделены запятыми. |
| `id` | query | integer | No |  |
| `id__in` | query | array | No | Несколько значений могут быть разделены запятыми. |
| `ordering` | query | string | No | Which field to use when ordering the results. |
| `page` | query | integer | No | A page number within the paginated result set. |
| `pageSize` | query | integer | No | Number of results to return per page. |
| `rental_point` | query | integer | No |  |
| `rental_point__in` | query | array | No | Несколько значений могут быть разделены запятыми. |
| `search` | query | string | No | A search term. |
| `state` | query | integer | No |  |
| `state__in` | query | array | No | Несколько значений могут быть разделены запятыми. |

**Response 200**: `PaginatedInventoryMaintenanceTableList`

---

### `GET` `/v1/crm/maintenances/tasklist/distance/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `page` | query | integer | No | A page number within the paginated result set. |
| `pageSize` | query | integer | No | Number of results to return per page. |

**Response 200**: `PaginatedInventoryMaintenanceTasklistList`

---

### `GET` `/v1/crm/maintenances/tasklist/interval/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `page` | query | integer | No | A page number within the paginated result set. |
| `pageSize` | query | integer | No | Number of results to return per page. |

**Response 200**: `PaginatedInventoryMaintenanceTasklistList`

---

### `GET` `/v1/crm/maintenances/{id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `id` | path | integer | Yes |  |

**Response 200**: `InventoryMaintenance`

---

### `PUT` `/v1/crm/maintenances/{id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `id` | path | integer | Yes |  |

**Request Body** (`application/json`): `BaseInventoryMaintenance`

**Response 200**: `BaseInventoryMaintenance`

---

### `PATCH` `/v1/crm/maintenances/{id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `id` | path | integer | Yes |  |

**Request Body** (`application/json`): `PatchedBaseInventoryMaintenance`

**Response 200**: `BaseInventoryMaintenance`

---

### `DELETE` `/v1/crm/maintenances/{id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `id` | path | integer | Yes |  |

**Response 204**: No response body

---

### `POST` `/v1/crm/maintenances/{id}/finish/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `id` | path | integer | Yes |  |

**Request Body** (`application/json`): `InventoryMaintenanceFinish`

**Response 201**: `InventoryMaintenanceFinish`

---

### `GET` `/v1/crm/services/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `category` | query | integer | No |  |
| `page` | query | integer | No | A page number within the paginated result set. |
| `pageSize` | query | integer | No | Number of results to return per page. |
| `search` | query | string | No | A search term. |
| `type` | query | integer | No | * `0` - Доставка * `1` - Не выбрано * `2` - Доставка обратно * `3` - Доставка туда и обратно * `4` - |

**Response 200**: `PaginatedServiceList`

---

### `POST` `/v1/crm/services/`

**Request Body** (`application/json`): `Service`

**Response 201**: `Service`

---

### `GET` `/v1/crm/services/general/`

**Response 200**: `ServiceGeneral`

---

### `GET` `/v1/crm/services/{id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `id` | path | integer | Yes |  |

**Response 200**: `Service`

---

### `PUT` `/v1/crm/services/{id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `id` | path | integer | Yes |  |

**Request Body** (`application/json`): `Service`

**Response 200**: `Service`

---

### `PATCH` `/v1/crm/services/{id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `id` | path | integer | Yes |  |

**Request Body** (`application/json`): `PatchedService`

**Response 200**: `Service`

---

### `DELETE` `/v1/crm/services/{id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `id` | path | integer | Yes |  |

**Response 204**: No response body

---

### `DELETE` `/v1/crm/services/{id}/archive`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `id` | path | integer | Yes |  |

**Response 204**: No response body

---

### `POST` `/v1/crm/services/{service_id}/tarifs/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `service_id` | path | integer | Yes |  |

**Request Body** (`application/json`): `ServiceTarifs`

**Response 201**: `ServiceTarifs`

---

### `PUT` `/v1/crm/services/{service_id}/tarifs/{id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `id` | path | integer | Yes |  |
| `service_id` | path | integer | Yes |  |

**Request Body** (`application/json`): `ServiceTarifs`

**Response 200**: `ServiceTarifs`

---

### `PATCH` `/v1/crm/services/{service_id}/tarifs/{id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `id` | path | integer | Yes |  |
| `service_id` | path | integer | Yes |  |

**Request Body** (`application/json`): `PatchedServiceTarifs`

**Response 200**: `ServiceTarifs`

---

### `DELETE` `/v1/crm/services/{service_id}/tarifs/{id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `id` | path | integer | Yes |  |
| `service_id` | path | integer | Yes |  |

**Response 204**: No response body

---

### `GET` `/v1/crm/tarifs/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `inventory` | query | integer | No |  |
| `inventory_group` | query | integer | No |  |
| `inventory_set__set` | query | integer | No |  |
| `page` | query | integer | No | A page number within the paginated result set. |
| `pageSize` | query | integer | No | Number of results to return per page. |

**Response 200**: `PaginatedTarifList`

---

### `POST` `/v1/crm/tarifs/`

**Request Body** (`application/json`): `Tarif`

**Response 201**: `Tarif`

---

### `POST` `/v1/crm/tarifs/bulk_create/`

**Request Body** (`application/json`): `TarifBulkCreate`

**Response 201**: `TarifBulkCreate`

---

### `POST` `/v1/crm/tarifs/bulk_update/`

**Request Body** (`application/json`): `TarifBulkUpdate`

**Response 201**: `TarifBulkUpdate`

---

### `GET` `/v1/crm/tarifs/{id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `id` | path | integer | Yes |  |

**Response 200**: `Tarif`

---

### `PUT` `/v1/crm/tarifs/{id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `id` | path | integer | Yes |  |

**Request Body** (`application/json`): `Tarif`

**Response 200**: `Tarif`

---

### `PATCH` `/v1/crm/tarifs/{id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `id` | path | integer | Yes |  |

**Request Body** (`application/json`): `PatchedTarif`

**Response 200**: `Tarif`

---

### `DELETE` `/v1/crm/tarifs/{id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `id` | path | integer | Yes |  |

**Response 204**: No response body

---

## Schemas

### `ActionEnum`

* `0` - создать
* `1` - обновить
* `2` - удалить
* `3` - доступ

**Enum values:** `[0, 1, 2, 3]`

### `BaseClient`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | Yes |  [readOnly] |
| `name` | `string` | Yes |  [maxLen=512] |
| `type` | `Type433Enum` | No |  |
| `avatar` | `string(uri)` | No |  [nullable] |
| `agreement_id` | `string` | Yes |  [nullable, readOnly] |
| `signed` | `boolean` | No |  |
| `sign_date` | `string(date)` | No |  [nullable] |
| `sign_expires` | `string(date)` | No |  [nullable] |
| `phone` | `string` | Yes |  [maxLen=32] |
| `email` | `string(email)` | No |  [nullable, maxLen=254] |
| `legal_type` | `LegalTypeEnum | NullEnum` | No |  [nullable] |
| `extra` | `` | No |  |

### `BaseInventory`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | Yes |  [readOnly] |
| `group` | `integer` | No |  [nullable] |
| `name` | `string` | Yes |  [maxLen=255] |
| `unique_id` | `string` | No |  [nullable, maxLen=255] |
| `category` | `integer` | Yes |  |
| `image` | `string(uri)` | No |  [nullable] |
| `extra` | `` | No |  |
| `sublease_user` | `integer` | No |  [nullable] |
| `state` | `integer` | No |  [nullable] |
| `disabled` | `DisabledEnum | NullEnum` | No |  [nullable] |
| `rental_point` | `integer` | Yes |  |

### `BaseInventoryGroup`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | Yes |  [readOnly] |
| `name` | `string` | No |  [nullable, maxLen=512] |
| `created_at` | `string(date-time)` | Yes |  [readOnly] |
| `deleted` | `boolean` | No |  |
| `updated_at` | `string(date-time)` | Yes |  [readOnly] |
| `category` | `integer` | No |  [nullable] |
| `unit_price` | `string(decimal)` | No |  |
| `unit_count` | `string(decimal)` | No |  |
| `unit_type` | `UnitTypeEnum` | No |  |
| `unit_sum` | `string(decimal)` | No |  |
| `image` | `string(uri)` | No |  [nullable] |
| `unique_id` | `string` | No |  [nullable, maxLen=255] |
| `barcode` | `string` | No |  [nullable, maxLen=255] |
| `extra` | `` | No |  |
| `filters` | `array[string]` | No |  [nullable] |
| `points` | `array[integer]` | No |  |
| `published` | `boolean` | No |  |
| `type` | `Type9ddEnum` | No |  |
| `price` | `string(decimal)` | No |  |
| `lifetime` | `integer` | No |  [nullable] |

### `BaseInventoryMaintenance`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | Yes |  [readOnly] |
| `name` | `string` | Yes |  [maxLen=255] |
| `description` | `string` | No |  [nullable] |
| `state` | `integer` | No |  [nullable] |
| `interval` | `string` | No |  [nullable] |
| `inventory` | `integer` | Yes |  |
| `type` | `Type5b9Enum` | Yes |  |
| `period_type` | `PeriodTypeEnum | NullEnum` | No |  [nullable] |
| `maintenance_date` | `string(date-time)` | No |  [nullable] |
| `distance_threshold` | `integer` | No |  [nullable] |
| `time_threshold` | `string` | No |  [nullable] |
| `responsible` | `integer` | Yes |  |
| `total_distance` | `integer(int64)` | No |  [nullable] |
| `distance` | `integer(int64)` | No |  [nullable] |
| `comment` | `string` | Yes |  [nullable, readOnly] |
| `fact_maintenance_date` | `string(date-time)` | Yes |  [nullable, readOnly] |
| `end_total_distance` | `integer` | Yes |  [nullable, readOnly] |

### `BaseInventoryTarif`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | Yes |  [readOnly] |
| `name` | `string` | No |  [maxLen=255] |
| `price` | `string(decimal)` | No |  |
| `time_period` | `integer` | No |  [nullable] |

### `BaseInventoryTarifUpdate`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | No |  |
| `weekdays` | `array[integer]` | No |  |
| `start` | `string(time)` | No |  [nullable] |
| `end` | `string(time)` | No |  [nullable] |
| `order` | `integer` | No |  |
| `name` | `string` | Yes |  |
| `price` | `string(decimal)` | Yes |  |
| `time_period` | `integer` | No |  [nullable] |

### `BonusTransaction`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | Yes |  [readOnly] |
| `bonus` | `integer` | Yes |  [readOnly] |
| `amount` | `string(decimal)` | No |  |
| `request` | `integer` | No |  [nullable] |
| `type` | `BonusTransactionTypeEnum` | No |  |
| `created_at` | `string(date-time)` | Yes |  [readOnly] |
| `created_by` | `integer` | Yes |  [nullable, readOnly] |
| `request_status` | `integer` | Yes |  [readOnly] |

### `BonusTransactionTypeEnum`

* `0` - transaction_spend
* `1` - transaction_earn

**Enum values:** `[0, 1]`

### `CarInventory`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | Yes |  [readOnly] |
| `group` | `integer` | No |  [nullable] |
| `name` | `string` | Yes |  [maxLen=255] |
| `unique_id` | `string` | No |  [nullable, maxLen=255] |
| `category` | `integer` | Yes |  |
| `image` | `string(uri)` | No |  [nullable] |
| `extra` | `` | No |  |
| `sublease_user` | `integer` | No |  [nullable] |
| `state` | `integer` | No |  [nullable] |
| `disabled` | `DisabledEnum | NullEnum` | No |  [nullable] |
| `rental_point` | `integer` | Yes |  |
| `car` | `InventoryCar` | Yes |  [readOnly] |

### `CategoryEnum`

* `0` - CREDIT
* `1` - DEBIT

**Enum values:** `[0, 1]`

### `Client`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | Yes |  [readOnly] |
| `ticks` | `array[ClientTickRelation]` | Yes |  [readOnly] |
| `bonus` | `ClientBonus` | Yes |  [readOnly] |
| `orders_count` | `integer` | Yes |  [readOnly] |
| `orders_amount` | `string(decimal)` | Yes |  [readOnly] |
| `orders_paid_amount` | `string(decimal)` | Yes |  [readOnly] |
| `orders_debt_amount` | `string(decimal)` | Yes |  [readOnly] |
| `overdue_rentals_amount` | `string(decimal)` | Yes |  [readOnly] |
| `transfer_count` | `integer` | Yes |  [readOnly] |
| `transfer_amount` | `string(decimal)` | Yes |  [readOnly] |
| `last_rent_date` | `string(date-time)` | Yes |  [readOnly] |
| `total_time` | `string` | Yes |  [readOnly] |
| `iin` | `string` | Yes |  [readOnly] |
| `bin` | `string` | Yes |  [readOnly] |
| `legal` | `PassportLegal` | No |  [nullable] |
| `individual` | `PassportIndividual` | No |  [nullable] |
| `balance` | `string` | Yes |  [readOnly] |
| `created_at` | `string(date-time)` | Yes |  [readOnly] |
| `updated_at` | `string(date-time)` | Yes |  [readOnly] |
| `uuid` | `string(uuid)` | Yes |  [readOnly] |
| `name` | `string` | Yes |  [maxLen=512] |
| `type` | `Type433Enum` | No |  |
| `legal_type` | `LegalTypeEnum | NullEnum` | No |  [nullable] |
| `gender` | `GenderEnum | NullEnum` | No |  [nullable] |
| `comment` | `string` | No |  [nullable, maxLen=512] |
| `avatar` | `string(uri)` | No |  [nullable] |
| `email` | `string(email)` | No |  [nullable, maxLen=254] |
| `phone` | `string` | Yes |  [maxLen=32] |
| `deposit` | `string(decimal)` | No |  [nullable] |
| `agreement_id` | `string` | Yes |  [nullable, readOnly] |
| `signed` | `boolean` | No |  |
| `sign_date` | `string(date)` | No |  [nullable] |
| `sign_expires` | `string(date)` | No |  [nullable] |
| `deleted_at` | `string(date-time)` | No |  [nullable] |
| `extra` | `` | No |  |
| `deleted` | `boolean` | No |  |
| `tenant` | `integer` | No |  |
| `legal_passport` | `integer` | No |  [nullable] |
| `individual_passport` | `integer` | No |  [nullable] |
| `attraction` | `integer` | No |  [nullable] |
| `discount` | `integer` | No |  [nullable] |
| `user` | `integer` | No |  [nullable] |

### `ClientBonus`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | Yes |  [readOnly] |
| `amount` | `string(decimal)` | No |  |
| `created_at` | `string(date-time)` | Yes |  [readOnly] |

### `ClientEdit`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | Yes |  [readOnly] |
| `ticks` | `array[integer]` | No |  |
| `bonus` | `ClientBonus` | Yes |  [readOnly] |
| `orders_count` | `integer` | Yes |  [readOnly] |
| `orders_amount` | `string(decimal)` | Yes |  [readOnly] |
| `orders_paid_amount` | `string(decimal)` | Yes |  [readOnly] |
| `orders_debt_amount` | `string(decimal)` | Yes |  [readOnly] |
| `overdue_rentals_amount` | `string(decimal)` | Yes |  [readOnly] |
| `transfer_count` | `integer` | Yes |  [readOnly] |
| `transfer_amount` | `string(decimal)` | Yes |  [readOnly] |
| `last_rent_date` | `string(date-time)` | Yes |  [readOnly] |
| `total_time` | `string` | Yes |  [readOnly] |
| `iin` | `string` | Yes |  [readOnly] |
| `bin` | `string` | Yes |  [readOnly] |
| `legal` | `PassportLegal` | No |  [nullable] |
| `individual` | `PassportIndividual` | No |  [nullable] |
| `balance` | `string` | Yes |  [readOnly] |
| `created_at` | `string(date-time)` | Yes |  [readOnly] |
| `updated_at` | `string(date-time)` | Yes |  [readOnly] |
| `uuid` | `string(uuid)` | Yes |  [readOnly] |
| `name` | `string` | Yes |  [maxLen=512] |
| `type` | `Type433Enum` | No |  |
| `legal_type` | `LegalTypeEnum | NullEnum` | No |  [nullable] |
| `gender` | `GenderEnum | NullEnum` | No |  [nullable] |
| `comment` | `string` | No |  [nullable, maxLen=512] |
| `avatar` | `string(uri)` | No |  [nullable] |
| `email` | `string(email)` | No |  [nullable, maxLen=254] |
| `phone` | `string` | Yes |  [maxLen=32] |
| `deposit` | `string(decimal)` | No |  [nullable] |
| `agreement_id` | `string` | Yes |  [nullable, readOnly] |
| `signed` | `boolean` | No |  |
| `sign_date` | `string(date)` | No |  [nullable] |
| `sign_expires` | `string(date)` | No |  [nullable] |
| `deleted_at` | `string(date-time)` | No |  [nullable] |
| `extra` | `` | No |  |
| `deleted` | `boolean` | No |  |
| `tenant` | `integer` | No |  |
| `legal_passport` | `integer` | No |  [nullable] |
| `individual_passport` | `integer` | No |  [nullable] |
| `attraction` | `integer` | No |  [nullable] |
| `discount` | `integer` | No |  [nullable] |
| `user` | `integer` | No |  [nullable] |

### `ClientGeneral`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `count` | `integer` | No |  |
| `avg` | `string(decimal)` | No |  |
| `sum` | `string(decimal)` | No |  |
| `multiple` | `integer` | No |  |
| `overdue_count` | `integer` | No |  |
| `overdue_amount` | `string(decimal)` | No |  |

### `ClientPassportIndividual`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | Yes |  [readOnly] |
| `created_at` | `string(date-time)` | Yes |  [readOnly] |
| `updated_at` | `string(date-time)` | Yes |  [readOnly] |
| `iin` | `string` | No |  [nullable, maxLen=14, minLen=12] |
| `address` | `string` | No |  [nullable, maxLen=255] |
| `document_number` | `string` | No |  [nullable, maxLen=255] |
| `issuer_manual` | `string` | No |  [nullable, maxLen=255] |
| `issue_date` | `string(date)` | No |  [nullable] |
| `issue_date_end` | `string(date)` | No |  [nullable] |
| `birth_date` | `string(date)` | No |  [nullable] |
| `extra` | `` | No |  |
| `tenant` | `integer` | No |  |

### `ClientPassportLegal`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | Yes |  [readOnly] |
| `created_at` | `string(date-time)` | Yes |  [readOnly] |
| `updated_at` | `string(date-time)` | Yes |  [readOnly] |
| `bin` | `string` | No |  [nullable, maxLen=12, minLen=12] |
| `address` | `string` | No |  [nullable, maxLen=255] |
| `director` | `string` | No |  [nullable, maxLen=255] |
| `iban` | `string` | No |  [nullable, maxLen=25] |
| `bik` | `string` | No |  [nullable, maxLen=8] |
| `bank` | `string` | No |  [nullable, maxLen=255] |
| `extra` | `` | No |  |
| `tenant` | `integer` | No |  |

### `ClientTickRelation`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | Yes |  [readOnly] |
| `tick` | `integer` | Yes |  |
| `created_at` | `string(date-time)` | Yes |  [readOnly] |

### `Counterparty`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | Yes |  [readOnly] |
| `access` | `array[integer]` | No |  [nullable] |
| `name` | `string` | Yes |  [maxLen=255] |
| `side` | `SideEnum` | No |  |
| `source` | `SourceEnum` | No |  |
| `type` | `Type6ecEnum` | No |  |
| `category` | `CategoryEnum` | No |  |
| `iin` | `string` | No |  [nullable, maxLen=12, minLen=12] |
| `bin` | `string` | No |  [nullable, maxLen=12, minLen=12] |
| `iban` | `string` | No |  [nullable, maxLen=25] |
| `bank` | `string` | No |  [nullable, maxLen=255] |
| `phone` | `string` | No |  [nullable, maxLen=32] |
| `owner` | `string` | No |  [nullable, maxLen=255] |
| `address` | `string` | No |  [nullable, maxLen=255] |
| `email` | `string(email)` | No |  [nullable, maxLen=254] |
| `order` | `integer` | No |  [nullable] |
| `extra` | `` | No |  |
| `deleted` | `boolean` | No |  |
| `deleted_at` | `string(date-time)` | No |  [nullable] |
| `tenant` | `integer` | No |  |

### `DisableBulk`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `ids` | `array[integer]` | No |  |
| `group_ids` | `array[integer]` | No |  |
| `inventory_ids` | `array[integer]` | No |  |
| `service_ids` | `array[integer]` | No |  |
| `set_ids` | `array[integer]` | No |  |
| `method` | `MethodEnum` | Yes |  |
| `comment` | `string` | No |  [maxLen=512, default=] |
| `extra` | `` | No |  [nullable] |
| `disable` | `boolean` | No |  [default=True] |

### `DisableList`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | Yes |  [readOnly] |
| `method` | `MethodEnum` | No |  |
| `comment` | `string` | No |  [nullable, maxLen=512] |
| `created_at` | `string(date-time)` | Yes |  [readOnly] |
| `created_by` | `integer` | No |  [nullable] |
| `inventory` | `BaseInventory` | Yes |  [readOnly] |
| `group` | `BaseInventoryGroup` | Yes |  [readOnly] |
| `service` | `Service` | Yes |  [readOnly] |
| `set` | `InventorySetInfo` | Yes |  [readOnly] |
| `extra` | `` | No |  |

### `DisabledEnum`

* `0` - delete
* `1` - archive
* `2` - withdraw

**Enum values:** `[0, 1, 2]`

### `GenderEnum`

* `0` - мужской
* `1` - женский

**Enum values:** `[0, 1]`

### `IndividualClientData`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `name` | `string` | Yes |  |
| `phone` | `string` | No |  [nullable] |
| `email` | `string` | No |  [nullable] |
| `document_number` | `string` | No |  [nullable] |
| `issue_date` | `string` | No |  [nullable] |
| `issue_date_end` | `string` | No |  [nullable] |
| `birth_date` | `string` | No |  [nullable] |
| `attraction_method` | `string` | No |  [nullable] |
| `iin` | `string` | No |  [nullable] |

### `IndividualClientImport`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `data` | `array[IndividualClientData]` | Yes |  |

### `InventorizationBulkCreate`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `request_id` | `integer` | Yes |  |
| `inventories` | `array[InventorizationBulkInventoryCreate]` | Yes |  |

### `InventorizationBulkInventoryCreate`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `request_inventory` | `integer` | Yes |  |
| `inventory` | `integer` | Yes |  |
| `state` | `integer` | Yes |  |
| `body` | `string` | No |  |
| `extra` | `` | No |  [nullable] |
| `images` | `array[integer]` | No |  |

### `InventorizationCreate`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | Yes |  [readOnly] |
| `request` | `integer` | No |  [nullable] |
| `inventory` | `integer` | Yes |  |
| `state` | `integer` | Yes |  |
| `body` | `string` | Yes |  [maxLen=512] |
| `created_by` | `integer` | No |  |
| `images` | `array[integer]` | No |  |
| `extra` | `` | No |  [nullable] |

### `InventorizationDetail`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | Yes |  [readOnly] |
| `created_at` | `string(date-time)` | Yes |  [readOnly] |
| `request` | `integer` | Yes |  [nullable, readOnly] |
| `request_status` | `integer` | Yes |  [readOnly] |
| `request_inventory` | `integer` | Yes |  [nullable, readOnly] |
| `created_by` | `integer` | Yes |  [readOnly] |
| `inventory` | `InventorizationInventory` | Yes |  [readOnly] |
| `state` | `integer` | Yes |  |
| `body` | `string` | Yes |  [maxLen=512] |
| `checked` | `boolean` | Yes |  [readOnly] |
| `inventory_status` | `integer` | Yes |  [readOnly] |
| `prev` | `integer` | Yes |  [readOnly] |
| `distances` | `array[InventoryDistance]` | Yes |  [readOnly] |
| `client` | `BaseClient` | Yes |  [readOnly] |

### `InventorizationInventory`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | Yes |  [readOnly] |
| `group` | `integer` | No |  [nullable] |
| `name` | `string` | Yes |  [maxLen=255] |
| `unique_id` | `string` | No |  [nullable, maxLen=255] |
| `category` | `integer` | Yes |  |
| `image` | `string(uri)` | No |  [nullable] |
| `extra` | `` | No |  |
| `sublease_user` | `integer` | No |  [nullable] |
| `state` | `integer` | No |  [nullable] |
| `disabled` | `DisabledEnum | NullEnum` | No |  [nullable] |
| `rental_point` | `integer` | Yes |  |
| `car` | `InventoryCar` | No |  |

### `InventorizationTasklist`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | Yes |  [readOnly] |
| `group` | `integer` | No |  [nullable] |
| `name` | `string` | Yes |  [maxLen=255] |
| `unique_id` | `string` | No |  [nullable, maxLen=255] |
| `category` | `integer` | Yes |  |
| `image` | `string(uri)` | No |  [nullable] |
| `extra` | `` | No |  |
| `sublease_user` | `integer` | No |  [nullable] |
| `state` | `integer` | No |  [nullable] |
| `disabled` | `DisabledEnum | NullEnum` | No |  [nullable] |
| `rental_point` | `integer` | Yes |  |
| `last_inventorization` | `string` | Yes |  [readOnly] |
| `status` | `StatusE96Enum` | Yes |  |
| `car` | `InventoryCar` | No |  |

### `Inventory`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | Yes |  [readOnly] |
| `image` | `string` | Yes |  [readOnly] |
| `disabled` | `DisabledEnum | NullEnum` | No |  [nullable] |
| `status` | `StatusE96Enum` | Yes |  |
| `car` | `InventoryCar` | No |  |
| `current_client` | `string` | Yes |  [readOnly] |
| `tarifs` | `array[InventoryTarif]` | No |  |
| `created_at` | `string(date-time)` | Yes |  [readOnly] |
| `updated_at` | `string(date-time)` | Yes |  [readOnly] |
| `name` | `string` | Yes |  [maxLen=255] |
| `unique_id` | `string` | No |  [nullable, maxLen=255] |
| `device_unique_id` | `string` | Yes |  [nullable, readOnly] |
| `type` | `Type9ddEnum` | No |  |
| `buy_price` | `string(decimal)` | No |  [nullable] |
| `buy_date` | `string(date)` | No |  [nullable] |
| `sell_price` | `string(decimal)` | No |  [nullable] |
| `sell_date` | `string(date-time)` | No |  [nullable] |
| `lifetime` | `integer` | No |  [nullable] |
| `stock_price` | `string(decimal)` | No |  [nullable] |
| `comment` | `string` | No |  [nullable, maxLen=1024] |
| `sublease_percent` | `string(decimal)` | No |  [nullable] |
| `prev_earning` | `string(decimal)` | No |  |
| `extra` | `` | No |  |
| `deleted` | `boolean` | No |  |
| `deleted_at` | `string(date-time)` | No |  [nullable] |
| `tenant` | `integer` | No |  |
| `category` | `integer` | Yes |  |
| `group` | `integer` | No |  [nullable] |
| `rental_point` | `integer` | Yes |  |
| `state` | `integer` | No |  [nullable] |
| `sublease_user` | `integer` | No |  [nullable] |

### `InventoryBulkUpdate`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | Yes |  |
| `inventories` | `array[integer]` | Yes |  |

### `InventoryCar`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | Yes |  [readOnly] |
| `brand` | `string` | No |  [nullable, maxLen=255] |
| `model` | `string` | No |  [nullable, maxLen=255] |
| `number` | `string` | Yes |  [maxLen=255] |
| `tech_passport` | `string` | Yes |  [maxLen=255] |

### `InventoryCarCreateUpdate`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `number` | `string` | Yes |  |
| `tech_passport` | `string` | Yes |  |
| `brand` | `string` | No |  [nullable] |
| `model` | `string` | No |  [nullable] |

### `InventoryClone`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `count` | `integer` | Yes |  |
| `rental_point` | `integer` | No |  [nullable] |
| `buy_price` | `string(decimal)` | No |  [nullable] |
| `buy_date` | `string(date)` | No |  [nullable] |
| `sublease_user` | `integer` | No |  |
| `sublease_percent` | `string(decimal)` | No |  |
| `extra` | `` | No |  |

### `InventoryData`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `unique_id` | `string` | No |  |
| `unique_id_group` | `string` | No |  |
| `category_name` | `string` | Yes |  |
| `inventory_name` | `string` | Yes |  |
| `group_name` | `string` | No |  |
| `rental_point_name` | `string` | Yes |  |
| `inventory_description` | `string` | No |  [default=] |
| `buy_price` | `string` | No |  [nullable] |
| `buy_date` | `string(date)` | No |  [nullable] |

### `InventoryDetailGeneral`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `rents_count` | `integer` | Yes |  |
| `rents_amount` | `string(decimal)` | No |  |
| `rents_duration` | `string` | No |  |
| `most_rents` | `InventoryDetailGeneralClient` | No |  |

### `InventoryDetailGeneralClient`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `count` | `integer` | No |  |
| `client` | `BaseClient` | No |  |

### `InventoryDistance`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | Yes |  [readOnly] |
| `inventory` | `integer` | Yes |  |
| `inventorization` | `integer` | No |  [nullable] |
| `distance` | `integer` | Yes |  |
| `created_at` | `string(date-time)` | Yes |  [readOnly] |

### `InventoryEdit`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | Yes |  [readOnly] |
| `car` | `InventoryCarCreateUpdate` | No |  [nullable] |
| `created_at` | `string(date-time)` | Yes |  [readOnly] |
| `updated_at` | `string(date-time)` | Yes |  [readOnly] |
| `name` | `string` | Yes |  [maxLen=255] |
| `unique_id` | `string` | No |  [nullable, maxLen=255] |
| `device_unique_id` | `string` | Yes |  [nullable, readOnly] |
| `type` | `Type9ddEnum` | No |  |
| `buy_price` | `string(decimal)` | No |  [nullable] |
| `buy_date` | `string(date)` | No |  [nullable] |
| `sell_price` | `string(decimal)` | No |  [nullable] |
| `sell_date` | `string(date-time)` | No |  [nullable] |
| `lifetime` | `integer` | No |  [nullable] |
| `stock_price` | `string(decimal)` | No |  [nullable] |
| `comment` | `string` | No |  [nullable, maxLen=1024] |
| `sublease_percent` | `string(decimal)` | No |  [nullable] |
| `image` | `string(uri)` | No |  [nullable] |
| `prev_earning` | `string(decimal)` | No |  |
| `extra` | `` | No |  |
| `deleted` | `boolean` | No |  |
| `deleted_at` | `string(date-time)` | No |  [nullable] |
| `tenant` | `integer` | No |  |
| `category` | `integer` | Yes |  |
| `group` | `integer` | No |  [nullable] |
| `rental_point` | `integer` | Yes |  |
| `state` | `integer` | No |  [nullable] |
| `sublease_user` | `integer` | No |  [nullable] |

### `InventoryGeneral`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `company` | `InventoryGeneralCount` | Yes |  |
| `sublease` | `InventoryGeneralCount` | Yes |  |
| `rent_amount` | `integer` | Yes |  |

### `InventoryGeneralCount`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `count` | `integer` | Yes |  |
| `count_free` | `integer` | Yes |  |
| `count_reserved` | `integer` | Yes |  |
| `count_inrent` | `integer` | Yes |  |
| `count_broken` | `integer` | Yes |  |
| `count_repair` | `integer` | Yes |  |
| `count_warehouse` | `integer` | Yes |  |

### `InventoryGroup`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | Yes |  [readOnly] |
| `name` | `string` | No |  [nullable, maxLen=512] |
| `created_at` | `string(date-time)` | Yes |  [readOnly] |
| `deleted` | `boolean` | No |  |
| `updated_at` | `string(date-time)` | Yes |  [readOnly] |
| `category` | `integer` | No |  [nullable] |
| `type` | `Type9ddEnum` | No |  |
| `price` | `string(decimal)` | No |  |
| `lifetime` | `integer` | No |  [nullable] |
| `image` | `string(uri)` | No |  [nullable] |
| `unique_id` | `string` | No |  [nullable, maxLen=255] |
| `barcode` | `string` | No |  [nullable, maxLen=255] |
| `extra` | `` | No |  |
| `filters` | `array[string]` | No |  [nullable] |
| `points` | `array[integer]` | No |  |
| `published` | `boolean` | No |  |
| `tarifs` | `array[BaseInventoryTarif]` | No |  |
| `disabled` | `DisabledEnum | NullEnum` | No |  [nullable] |
| `inventories_count` | `integer` | Yes |  [readOnly, default=0] |
| `inventories_free` | `integer` | Yes |  [readOnly, default=0] |
| `unit_type` | `UnitTypeEnum` | No |  |
| `unit_price` | `string(decimal)` | No |  |
| `unit_count` | `string(decimal)` | No |  |
| `unit_sum` | `string(decimal)` | No |  |
| `has_sublease` | `boolean` | Yes |  [readOnly] |
| `rent_count` | `string` | Yes |  [readOnly] |

### `InventoryGroupDetail`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | Yes |  [readOnly] |
| `inventories_count` | `integer` | No |  [default=0] |
| `inventories_free` | `integer` | Yes |  [readOnly, default=0] |
| `disabled` | `DisabledEnum | NullEnum` | No |  [nullable] |
| `image` | `string(uri)` | No |  [nullable] |
| `created_at` | `string(date-time)` | Yes |  [readOnly] |
| `updated_at` | `string(date-time)` | Yes |  [readOnly] |
| `name` | `string` | No |  [nullable, maxLen=512] |
| `unique_id` | `string` | No |  [nullable, maxLen=255] |
| `barcode` | `string` | No |  [nullable, maxLen=255] |
| `filters` | `array[string]` | No |  [nullable] |
| `slug` | `string` | No |  [nullable, maxLen=50] |
| `comment` | `string` | No |  [nullable, maxLen=512] |
| `type` | `Type9ddEnum` | No |  |
| `bonus` | `string(decimal)` | No |  [nullable] |
| `amount` | `integer` | No |  |
| `lifetime` | `integer` | No |  [nullable] |
| `price` | `string(decimal)` | No |  |
| `extra` | `` | No |  |
| `published` | `boolean` | No |  |
| `points` | `array[integer]` | No |  |
| `unit_type` | `UnitTypeEnum` | No |  |
| `unit_price` | `string(decimal)` | No |  |
| `unit_count` | `string(decimal)` | No |  |
| `unit_sum` | `string(decimal)` | No |  |
| `deleted` | `boolean` | No |  |
| `deleted_at` | `string(date-time)` | No |  [nullable] |
| `tenant` | `integer` | No |  |
| `category` | `integer` | No |  [nullable] |
| `discount` | `integer` | No |  [nullable] |
| `rental_point` | `integer` | No |  [nullable] |

### `InventoryGroupImport`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `groups` | `array[InventoryGroupImportItem]` | Yes |  |

### `InventoryGroupImportItem`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `group_name` | `string` | Yes |  |
| `unique_id_group` | `string` | Yes |  |
| `category_name` | `string` | Yes |  |
| `group_description` | `string` | No |  |
| `rental_point_name` | `string` | Yes |  |
| `amount` | `string` | Yes |  |
| `buy_price` | `string` | No |  [nullable] |
| `buy_date` | `string(date)` | No |  [nullable] |
| `tarif` | `string` | No |  [nullable] |

### `InventoryGroupState`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | Yes |  |
| `group` | `integer` | Yes |  |
| `count` | `integer` | No |  [default=0] |

### `InventoryGroupStatus`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `status` | `integer` | Yes |  |
| `group` | `integer` | Yes |  |
| `count` | `integer` | No |  [default=0] |

### `InventoryGroupTarif`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | Yes |  [readOnly] |
| `weekdays` | `array[integer]` | No |  |
| `created_at` | `string(date-time)` | Yes |  [readOnly] |
| `updated_at` | `string(date-time)` | Yes |  [readOnly] |
| `start` | `string(time)` | No |  [nullable] |
| `end` | `string(time)` | No |  [nullable] |
| `published` | `boolean` | No |  |
| `order` | `integer` | No |  |
| `name` | `string` | No |  [maxLen=255] |
| `price` | `string(decimal)` | No |  |
| `tenant` | `integer` | No |  |
| `inventory` | `integer` | Yes |  [nullable, readOnly] |
| `inventory_group` | `integer` | No |  [nullable] |
| `inventory_set` | `integer` | No |  [nullable] |
| `inventory_set_price` | `integer` | No |  [nullable] |
| `time_period` | `integer` | No |  [nullable] |

### `InventoryGroupUpdate`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | Yes |  [readOnly] |
| `name` | `string` | No |  [nullable, maxLen=512] |
| `comment` | `string` | No |  [nullable, maxLen=512] |
| `category` | `integer` | No |  [nullable] |
| `unique_id` | `string` | No |  [nullable, maxLen=255] |
| `barcode` | `string` | No |  [nullable, maxLen=255] |
| `image` | `string(uri)` | No |  [nullable] |
| `extra` | `` | No |  |
| `published` | `boolean` | No |  |
| `type` | `Type9ddEnum` | No |  |
| `price` | `string(decimal)` | No |  |
| `discount` | `integer` | No |  [nullable] |
| `tarif_form` | `array[BaseInventoryTarifUpdate]` | No |  |
| `inventory_form` | `InventoryClone` | No |  |
| `unit_type` | `UnitTypeEnum` | No |  |
| `unit_price` | `string(decimal)` | No |  |
| `unit_count` | `string(decimal)` | No |  |
| `unit_sum` | `string(decimal)` | No |  |
| `points` | `array[integer]` | No |  |
| `lifetime` | `integer` | No |  [nullable] |

### `InventoryImport`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `inventories` | `array[InventoryData]` | Yes |  |

### `InventoryInsurance`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | Yes |  [readOnly] |
| `created_at` | `string(date-time)` | Yes |  [readOnly] |
| `updated_at` | `string(date-time)` | Yes |  [readOnly] |
| `type` | `InventoryInsuranceTypeEnum` | No |  |
| `company` | `string` | No |  [nullable, maxLen=255] |
| `number` | `string` | No |  [nullable, maxLen=255] |
| `amount` | `string(decimal)` | No |  |
| `start_at` | `string(date-time)` | Yes |  |
| `end_at` | `string(date-time)` | Yes |  |
| `tenant` | `integer` | Yes |  [readOnly] |
| `inventory` | `integer` | Yes |  [readOnly] |

### `InventoryInsuranceTypeEnum`

* `CASCO` - CASCO
* `OGPO` - OGPO

**Enum values:** `['CASCO', 'OGPO']`

### `InventoryMaintenance`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | Yes |  [readOnly] |
| `name` | `string` | Yes |  [maxLen=255] |
| `description` | `string` | No |  [nullable] |
| `state` | `integer` | No |  [nullable] |
| `interval` | `string` | No |  [nullable] |
| `inventory` | `CarInventory` | Yes |  [readOnly] |
| `type` | `Type5b9Enum` | No |  |
| `period_type` | `PeriodTypeEnum | NullEnum` | No |  [nullable] |
| `maintenance_date` | `string(date-time)` | Yes |  |
| `distance_threshold` | `integer` | No |  [nullable] |
| `time_threshold` | `string` | No |  [nullable] |
| `responsible` | `integer` | Yes |  |
| `total_distance` | `integer(int64)` | No |  [nullable] |
| `distance` | `integer(int64)` | No |  [nullable] |
| `comment` | `string` | Yes |  [nullable, readOnly] |
| `fact_maintenance_date` | `string(date-time)` | Yes |  [nullable, readOnly] |
| `end_total_distance` | `integer` | Yes |  [nullable, readOnly] |

### `InventoryMaintenanceFinish`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | Yes |  [readOnly] |
| `state` | `integer` | No |  [nullable] |
| `comment` | `string` | Yes |  [nullable, maxLen=512] |

### `InventoryMaintenanceTable`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | Yes |  [readOnly] |
| `group` | `integer` | No |  [nullable] |
| `name` | `string` | Yes |  [maxLen=255] |
| `unique_id` | `string` | No |  [nullable, maxLen=255] |
| `category` | `integer` | Yes |  |
| `image` | `string(uri)` | No |  [nullable] |
| `extra` | `` | No |  |
| `sublease_user` | `integer` | No |  [nullable] |
| `state` | `integer` | No |  [nullable] |
| `disabled` | `DisabledEnum | NullEnum` | No |  [nullable] |
| `rental_point` | `integer` | Yes |  |
| `car` | `InventoryCar` | Yes |  [readOnly] |
| `maintenances` | `array[BaseInventoryMaintenance]` | Yes |  |
| `status` | `integer` | Yes |  [readOnly] |

### `InventoryMaintenanceTasklist`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | Yes |  [readOnly] |
| `group` | `integer` | No |  [nullable] |
| `name` | `string` | Yes |  [maxLen=255] |
| `unique_id` | `string` | No |  [nullable, maxLen=255] |
| `category` | `integer` | Yes |  |
| `image` | `string(uri)` | No |  [nullable] |
| `extra` | `` | No |  |
| `sublease_user` | `integer` | No |  [nullable] |
| `state` | `integer` | No |  [nullable] |
| `disabled` | `DisabledEnum | NullEnum` | No |  [nullable] |
| `rental_point` | `integer` | Yes |  |
| `car` | `InventoryCar` | Yes |  [readOnly] |
| `remaining_distance` | `integer` | Yes |  [readOnly] |
| `next_maintenance_date` | `string(date-time)` | Yes |  [readOnly] |

### `InventorySchedule`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | Yes |  [readOnly] |
| `car` | `InventoryCar` | Yes |  [readOnly] |
| `schedules` | `array[Schedule]` | Yes |  |
| `created_at` | `string(date-time)` | Yes |  [readOnly] |
| `updated_at` | `string(date-time)` | Yes |  [readOnly] |
| `name` | `string` | Yes |  [maxLen=255] |
| `unique_id` | `string` | No |  [nullable, maxLen=255] |
| `device_unique_id` | `string` | No |  [nullable, maxLen=255] |
| `type` | `Type9ddEnum` | No |  |
| `buy_price` | `string(decimal)` | No |  [nullable] |
| `buy_date` | `string(date)` | No |  [nullable] |
| `sell_price` | `string(decimal)` | No |  [nullable] |
| `sell_date` | `string(date-time)` | No |  [nullable] |
| `lifetime` | `integer` | No |  [nullable] |
| `stock_price` | `string(decimal)` | No |  [nullable] |
| `comment` | `string` | No |  [nullable, maxLen=1024] |
| `sublease_percent` | `string(decimal)` | No |  [nullable] |
| `image` | `string(uri)` | No |  [nullable] |
| `prev_earning` | `string(decimal)` | No |  |
| `extra` | `` | No |  |
| `deleted` | `boolean` | No |  |
| `deleted_at` | `string(date-time)` | No |  [nullable] |
| `tenant` | `integer` | No |  |
| `category` | `integer` | Yes |  |
| `group` | `integer` | No |  [nullable] |
| `rental_point` | `integer` | Yes |  |
| `state` | `integer` | No |  [nullable] |
| `sublease_user` | `integer` | No |  [nullable] |

### `InventoryScheduleMinMax`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `min_date` | `string(date-time)` | Yes |  |
| `max_date` | `string(date-time)` | Yes |  |

### `InventorySell`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `sell_price` | `string(decimal)` | Yes |  |
| `inventories` | `array[integer]` | Yes |  |

### `InventorySet`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | Yes |  [readOnly] |
| `name` | `string` | Yes |  [maxLen=255] |
| `unique_id` | `string` | No |  [nullable, maxLen=255] |
| `image` | `string(uri)` | No |  [nullable] |
| `category` | `integer` | No |  [nullable] |
| `status` | `integer` | Yes |  [readOnly] |
| `price` | `string(decimal)` | No |  [nullable] |
| `discount` | `integer` | No |  [nullable] |
| `prices` | `array[InventorySetPrice]` | Yes |  [readOnly] |
| `items` | `array[InventorySetItem]` | Yes |  [readOnly] |
| `static` | `boolean` | No |  |
| `extra` | `` | No |  |
| `published` | `boolean` | No |  |
| `deleted` | `boolean` | Yes |  [readOnly] |

### `InventorySetGeneral`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `count` | `integer` | Yes |  |
| `set_count` | `integer` | Yes |  [readOnly] |
| `set_available` | `integer` | Yes |  |
| `amount` | `string(decimal)` | Yes |  |

### `InventorySetInfo`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | Yes |  [readOnly] |
| `name` | `string` | Yes |  [maxLen=255] |
| `unique_id` | `string` | No |  [nullable, maxLen=255] |
| `image` | `string(uri)` | No |  [nullable] |
| `category` | `integer` | No |  [nullable] |
| `static` | `boolean` | No |  |
| `extra` | `` | No |  |
| `published` | `boolean` | No |  |

### `InventorySetItem`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | No |  |
| `count` | `integer` | Yes |  |
| `group_id` | `integer` | Yes |  |
| `group_name` | `string` | Yes |  [readOnly] |
| `group_unique_id` | `string` | Yes |  [readOnly] |
| `group_category` | `integer` | Yes |  [readOnly] |
| `group_image` | `string` | Yes |  [readOnly] |
| `inventories_count` | `integer` | Yes |  [readOnly, default=0] |
| `inventories_free` | `integer` | Yes |  [readOnly, default=0] |
| `alternative` | `integer` | No |  [nullable] |
| `required` | `boolean` | No |  |

### `InventorySetPrice`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | No |  |
| `name` | `string` | Yes |  |
| `period_id` | `integer` | Yes |  |
| `price` | `string(decimal)` | Yes |  |
| `order` | `integer` | No |  |

### `InventorySetPriceSerializerV2`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | Yes |  [readOnly] |
| `name` | `string` | No |  [nullable, maxLen=255] |
| `period` | `integer` | Yes |  |
| `order` | `integer` | No |  |

### `InventorySetPriceTarif`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | Yes |  [readOnly] |
| `price` | `string(decimal)` | No |  |
| `time_period` | `integer` | No |  [nullable] |
| `inventory_set` | `integer` | No |  [nullable] |
| `inventory_set_price` | `integer` | No |  [nullable] |

### `InventorySetTarifBulkCreate`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `tarifs` | `array[InventorySetTarifBulkCreateEntity]` | Yes |  |

### `InventorySetTarifBulkCreateEntity`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `price` | `string(decimal)` | Yes |  |
| `inventory_set` | `integer` | Yes |  |
| `inventory_set_price` | `integer` | Yes |  |

### `InventorySetTarifBulkUpdate`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `tarifs` | `array[InventorySetTarifBulkUpdateEntity]` | Yes |  |

### `InventorySetTarifBulkUpdateEntity`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `price` | `string(decimal)` | Yes |  |
| `inventory_set` | `integer` | Yes |  |
| `inventory_set_price` | `integer` | Yes |  |
| `id` | `integer` | Yes |  |

### `InventoryStateDetail`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `state` | `integer` | Yes |  |
| `count` | `integer` | No |  [default=0] |

### `InventoryTarif`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | Yes |  [readOnly] |
| `set_id` | `integer` | Yes |  [readOnly] |
| `group_id` | `integer` | Yes |  [readOnly] |
| `weekdays` | `array[integer]` | No |  |
| `created_at` | `string(date-time)` | Yes |  [readOnly] |
| `updated_at` | `string(date-time)` | Yes |  [readOnly] |
| `start` | `string(time)` | No |  [nullable] |
| `end` | `string(time)` | No |  [nullable] |
| `published` | `boolean` | No |  |
| `order` | `integer` | No |  |
| `name` | `string` | No |  [maxLen=255] |
| `price` | `string(decimal)` | No |  |
| `tenant` | `integer` | No |  |
| `inventory` | `integer` | Yes |  [nullable, readOnly] |
| `inventory_group` | `integer` | No |  [nullable] |
| `inventory_set` | `integer` | Yes |  [nullable, readOnly] |
| `inventory_set_price` | `integer` | No |  [nullable] |
| `time_period` | `integer` | No |  [nullable] |

### `InventoryTransfer`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `rental_point` | `integer` | Yes |  |
| `inventories` | `array[integer]` | Yes |  |

### `LegalClientData`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `name` | `string` | Yes |  |
| `phone` | `string` | No |  [nullable] |
| `email` | `string` | No |  [nullable] |
| `bin` | `string` | No |  [nullable] |
| `address` | `string` | No |  [nullable] |
| `director` | `string` | No |  [nullable] |
| `bik` | `string` | No |  [nullable] |
| `bank` | `string` | No |  [nullable] |
| `iban` | `string` | No |  [nullable] |

### `LegalClientImport`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `data` | `array[LegalClientData]` | Yes |  |

### `LegalTypeEnum`

* `0` - ИП
* `1` - ТОО
* `2` - АО
* `3` - ПК

**Enum values:** `[0, 1, 2, 3]`

### `LogEntry`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | Yes |  [readOnly] |
| `content_type` | `integer` | Yes |  |
| `object_pk` | `string` | Yes |  [maxLen=255] |
| `object_id` | `integer(int64)` | No |  [nullable] |
| `actor` | `integer` | No |  [nullable] |
| `serialized_data` | `` | No |  [nullable] |
| `action` | `ActionEnum` | Yes |  |
| `changes` | `` | No |  [nullable] |
| `timestamp` | `string(date-time)` | No |  |

### `MethodEnum`

* `0` - delete
* `1` - archive
* `2` - withdraw

**Enum values:** `[0, 1, 2]`

### `NullEnum`

**Enum values:** `[None]`

### `OrderRequestDeposit`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | Yes |  [readOnly] |
| `created_by` | `integer` | Yes |  [readOnly] |
| `payment_type` | `integer` | No |  [nullable] |
| `type` | `OrderRequestDepositTypeEnum` | Yes |  |
| `status` | `OrderRequestDepositStatusEnum` | Yes |  |
| `request` | `integer` | Yes |  [readOnly] |
| `created_at` | `string(date-time)` | Yes |  [readOnly] |
| `deposit` | `string` | Yes |  [maxLen=255] |
| `amount` | `string(decimal)` | No |  |
| `returned_at` | `string(date-time)` | Yes |  [nullable, readOnly] |
| `transaction_amount` | `string(decimal)` | Yes |  [readOnly] |

### `OrderRequestDepositStatusEnum`

* `0` - DEFAULT
* `1` - RECEIVED
* `2` - RETURNED

**Enum values:** `[0, 1, 2]`

### `OrderRequestDepositTypeEnum`

* `0` - STRING
* `1` - AMOUNT

**Enum values:** `[0, 1]`

### `PaginatedBonusTransactionList`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `count` | `integer` | Yes |  |
| `next` | `string(uri)` | No |  [nullable] |
| `previous` | `string(uri)` | No |  [nullable] |
| `results` | `array[BonusTransaction]` | Yes |  |

### `PaginatedClientList`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `count` | `integer` | Yes |  |
| `next` | `string(uri)` | No |  [nullable] |
| `previous` | `string(uri)` | No |  [nullable] |
| `results` | `array[Client]` | Yes |  |

### `PaginatedDisableListList`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `count` | `integer` | Yes |  |
| `next` | `string(uri)` | No |  [nullable] |
| `previous` | `string(uri)` | No |  [nullable] |
| `results` | `array[DisableList]` | Yes |  |

### `PaginatedInventorizationDetailList`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `count` | `integer` | Yes |  |
| `next` | `string(uri)` | No |  [nullable] |
| `previous` | `string(uri)` | No |  [nullable] |
| `results` | `array[InventorizationDetail]` | Yes |  |

### `PaginatedInventorizationTasklistList`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `count` | `integer` | Yes |  |
| `next` | `string(uri)` | No |  [nullable] |
| `previous` | `string(uri)` | No |  [nullable] |
| `results` | `array[InventorizationTasklist]` | Yes |  |

### `PaginatedInventoryDistanceList`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `count` | `integer` | Yes |  |
| `next` | `string(uri)` | No |  [nullable] |
| `previous` | `string(uri)` | No |  [nullable] |
| `results` | `array[InventoryDistance]` | Yes |  |

### `PaginatedInventoryGroupList`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `count` | `integer` | Yes |  |
| `next` | `string(uri)` | No |  [nullable] |
| `previous` | `string(uri)` | No |  [nullable] |
| `results` | `array[InventoryGroup]` | Yes |  |

### `PaginatedInventoryList`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `count` | `integer` | Yes |  |
| `next` | `string(uri)` | No |  [nullable] |
| `previous` | `string(uri)` | No |  [nullable] |
| `results` | `array[Inventory]` | Yes |  |

### `PaginatedInventoryMaintenanceList`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `count` | `integer` | Yes |  |
| `next` | `string(uri)` | No |  [nullable] |
| `previous` | `string(uri)` | No |  [nullable] |
| `results` | `array[InventoryMaintenance]` | Yes |  |

### `PaginatedInventoryMaintenanceTableList`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `count` | `integer` | Yes |  |
| `next` | `string(uri)` | No |  [nullable] |
| `previous` | `string(uri)` | No |  [nullable] |
| `results` | `array[InventoryMaintenanceTable]` | Yes |  |

### `PaginatedInventoryMaintenanceTasklistList`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `count` | `integer` | Yes |  |
| `next` | `string(uri)` | No |  [nullable] |
| `previous` | `string(uri)` | No |  [nullable] |
| `results` | `array[InventoryMaintenanceTasklist]` | Yes |  |

### `PaginatedInventoryScheduleList`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `count` | `integer` | Yes |  |
| `next` | `string(uri)` | No |  [nullable] |
| `previous` | `string(uri)` | No |  [nullable] |
| `results` | `array[InventorySchedule]` | Yes |  |

### `PaginatedInventorySetList`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `count` | `integer` | Yes |  |
| `next` | `string(uri)` | No |  [nullable] |
| `previous` | `string(uri)` | No |  [nullable] |
| `results` | `array[InventorySet]` | Yes |  |

### `PaginatedLogEntryList`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `count` | `integer` | Yes |  |
| `next` | `string(uri)` | No |  [nullable] |
| `previous` | `string(uri)` | No |  [nullable] |
| `results` | `array[LogEntry]` | Yes |  |

### `PaginatedServiceList`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `count` | `integer` | Yes |  |
| `next` | `string(uri)` | No |  [nullable] |
| `previous` | `string(uri)` | No |  [nullable] |
| `results` | `array[Service]` | Yes |  |

### `PaginatedTarifList`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `count` | `integer` | Yes |  |
| `next` | `string(uri)` | No |  [nullable] |
| `previous` | `string(uri)` | No |  [nullable] |
| `results` | `array[Tarif]` | Yes |  |

### `PassportIndividual`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `iin` | `string` | No |  [nullable, maxLen=14, minLen=12] |
| `address` | `string` | No |  [nullable, maxLen=255] |
| `document_number` | `string` | No |  [nullable, maxLen=255] |
| `issuer_manual` | `string` | No |  [nullable, maxLen=255] |
| `issue_date` | `string(date)` | No |  [nullable] |
| `issue_date_end` | `string(date)` | No |  [nullable] |
| `birth_date` | `string(date)` | No |  [nullable] |

### `PassportLegal`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `bin` | `string` | No |  [nullable, maxLen=12, minLen=12] |
| `address` | `string` | No |  [nullable, maxLen=255] |
| `director` | `string` | No |  [nullable, maxLen=255] |
| `iban` | `string` | No |  [nullable, maxLen=25] |
| `bik` | `string` | No |  [nullable, maxLen=8] |
| `bank` | `string` | No |  [nullable, maxLen=255] |

### `PatchedBaseInventoryMaintenance`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | No |  [readOnly] |
| `name` | `string` | No |  [maxLen=255] |
| `description` | `string` | No |  [nullable] |
| `state` | `integer` | No |  [nullable] |
| `interval` | `string` | No |  [nullable] |
| `inventory` | `integer` | No |  |
| `type` | `Type5b9Enum` | No |  |
| `period_type` | `PeriodTypeEnum | NullEnum` | No |  [nullable] |
| `maintenance_date` | `string(date-time)` | No |  [nullable] |
| `distance_threshold` | `integer` | No |  [nullable] |
| `time_threshold` | `string` | No |  [nullable] |
| `responsible` | `integer` | No |  |
| `total_distance` | `integer(int64)` | No |  [nullable] |
| `distance` | `integer(int64)` | No |  [nullable] |
| `comment` | `string` | No |  [nullable, readOnly] |
| `fact_maintenance_date` | `string(date-time)` | No |  [nullable, readOnly] |
| `end_total_distance` | `integer` | No |  [nullable, readOnly] |

### `PatchedClientEdit`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | No |  [readOnly] |
| `ticks` | `array[integer]` | No |  |
| `bonus` | `ClientBonus` | No |  [readOnly] |
| `orders_count` | `integer` | No |  [readOnly] |
| `orders_amount` | `string(decimal)` | No |  [readOnly] |
| `orders_paid_amount` | `string(decimal)` | No |  [readOnly] |
| `orders_debt_amount` | `string(decimal)` | No |  [readOnly] |
| `overdue_rentals_amount` | `string(decimal)` | No |  [readOnly] |
| `transfer_count` | `integer` | No |  [readOnly] |
| `transfer_amount` | `string(decimal)` | No |  [readOnly] |
| `last_rent_date` | `string(date-time)` | No |  [readOnly] |
| `total_time` | `string` | No |  [readOnly] |
| `iin` | `string` | No |  [readOnly] |
| `bin` | `string` | No |  [readOnly] |
| `legal` | `PassportLegal` | No |  [nullable] |
| `individual` | `PassportIndividual` | No |  [nullable] |
| `balance` | `string` | No |  [readOnly] |
| `created_at` | `string(date-time)` | No |  [readOnly] |
| `updated_at` | `string(date-time)` | No |  [readOnly] |
| `uuid` | `string(uuid)` | No |  [readOnly] |
| `name` | `string` | No |  [maxLen=512] |
| `type` | `Type433Enum` | No |  |
| `legal_type` | `LegalTypeEnum | NullEnum` | No |  [nullable] |
| `gender` | `GenderEnum | NullEnum` | No |  [nullable] |
| `comment` | `string` | No |  [nullable, maxLen=512] |
| `avatar` | `string(uri)` | No |  [nullable] |
| `email` | `string(email)` | No |  [nullable, maxLen=254] |
| `phone` | `string` | No |  [maxLen=32] |
| `deposit` | `string(decimal)` | No |  [nullable] |
| `agreement_id` | `string` | No |  [nullable, readOnly] |
| `signed` | `boolean` | No |  |
| `sign_date` | `string(date)` | No |  [nullable] |
| `sign_expires` | `string(date)` | No |  [nullable] |
| `deleted_at` | `string(date-time)` | No |  [nullable] |
| `extra` | `` | No |  |
| `deleted` | `boolean` | No |  |
| `tenant` | `integer` | No |  |
| `legal_passport` | `integer` | No |  [nullable] |
| `individual_passport` | `integer` | No |  [nullable] |
| `attraction` | `integer` | No |  [nullable] |
| `discount` | `integer` | No |  [nullable] |
| `user` | `integer` | No |  [nullable] |

### `PatchedClientPassportIndividual`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | No |  [readOnly] |
| `created_at` | `string(date-time)` | No |  [readOnly] |
| `updated_at` | `string(date-time)` | No |  [readOnly] |
| `iin` | `string` | No |  [nullable, maxLen=14, minLen=12] |
| `address` | `string` | No |  [nullable, maxLen=255] |
| `document_number` | `string` | No |  [nullable, maxLen=255] |
| `issuer_manual` | `string` | No |  [nullable, maxLen=255] |
| `issue_date` | `string(date)` | No |  [nullable] |
| `issue_date_end` | `string(date)` | No |  [nullable] |
| `birth_date` | `string(date)` | No |  [nullable] |
| `extra` | `` | No |  |
| `tenant` | `integer` | No |  |

### `PatchedClientPassportLegal`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | No |  [readOnly] |
| `created_at` | `string(date-time)` | No |  [readOnly] |
| `updated_at` | `string(date-time)` | No |  [readOnly] |
| `bin` | `string` | No |  [nullable, maxLen=12, minLen=12] |
| `address` | `string` | No |  [nullable, maxLen=255] |
| `director` | `string` | No |  [nullable, maxLen=255] |
| `iban` | `string` | No |  [nullable, maxLen=25] |
| `bik` | `string` | No |  [nullable, maxLen=8] |
| `bank` | `string` | No |  [nullable, maxLen=255] |
| `extra` | `` | No |  |
| `tenant` | `integer` | No |  |

### `PatchedCounterparty`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | No |  [readOnly] |
| `access` | `array[integer]` | No |  [nullable] |
| `name` | `string` | No |  [maxLen=255] |
| `side` | `SideEnum` | No |  |
| `source` | `SourceEnum` | No |  |
| `type` | `Type6ecEnum` | No |  |
| `category` | `CategoryEnum` | No |  |
| `iin` | `string` | No |  [nullable, maxLen=12, minLen=12] |
| `bin` | `string` | No |  [nullable, maxLen=12, minLen=12] |
| `iban` | `string` | No |  [nullable, maxLen=25] |
| `bank` | `string` | No |  [nullable, maxLen=255] |
| `phone` | `string` | No |  [nullable, maxLen=32] |
| `owner` | `string` | No |  [nullable, maxLen=255] |
| `address` | `string` | No |  [nullable, maxLen=255] |
| `email` | `string(email)` | No |  [nullable, maxLen=254] |
| `order` | `integer` | No |  [nullable] |
| `extra` | `` | No |  |
| `deleted` | `boolean` | No |  |
| `deleted_at` | `string(date-time)` | No |  [nullable] |
| `tenant` | `integer` | No |  |

### `PatchedInventoryEdit`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | No |  [readOnly] |
| `car` | `InventoryCarCreateUpdate` | No |  [nullable] |
| `created_at` | `string(date-time)` | No |  [readOnly] |
| `updated_at` | `string(date-time)` | No |  [readOnly] |
| `name` | `string` | No |  [maxLen=255] |
| `unique_id` | `string` | No |  [nullable, maxLen=255] |
| `device_unique_id` | `string` | No |  [nullable, readOnly] |
| `type` | `Type9ddEnum` | No |  |
| `buy_price` | `string(decimal)` | No |  [nullable] |
| `buy_date` | `string(date)` | No |  [nullable] |
| `sell_price` | `string(decimal)` | No |  [nullable] |
| `sell_date` | `string(date-time)` | No |  [nullable] |
| `lifetime` | `integer` | No |  [nullable] |
| `stock_price` | `string(decimal)` | No |  [nullable] |
| `comment` | `string` | No |  [nullable, maxLen=1024] |
| `sublease_percent` | `string(decimal)` | No |  [nullable] |
| `image` | `string(uri)` | No |  [nullable] |
| `prev_earning` | `string(decimal)` | No |  |
| `extra` | `` | No |  |
| `deleted` | `boolean` | No |  |
| `deleted_at` | `string(date-time)` | No |  [nullable] |
| `tenant` | `integer` | No |  |
| `category` | `integer` | No |  |
| `group` | `integer` | No |  [nullable] |
| `rental_point` | `integer` | No |  |
| `state` | `integer` | No |  [nullable] |
| `sublease_user` | `integer` | No |  [nullable] |

### `PatchedInventoryGroupTarif`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | No |  [readOnly] |
| `weekdays` | `array[integer]` | No |  |
| `created_at` | `string(date-time)` | No |  [readOnly] |
| `updated_at` | `string(date-time)` | No |  [readOnly] |
| `start` | `string(time)` | No |  [nullable] |
| `end` | `string(time)` | No |  [nullable] |
| `published` | `boolean` | No |  |
| `order` | `integer` | No |  |
| `name` | `string` | No |  [maxLen=255] |
| `price` | `string(decimal)` | No |  |
| `tenant` | `integer` | No |  |
| `inventory` | `integer` | No |  [nullable, readOnly] |
| `inventory_group` | `integer` | No |  [nullable] |
| `inventory_set` | `integer` | No |  [nullable] |
| `inventory_set_price` | `integer` | No |  [nullable] |
| `time_period` | `integer` | No |  [nullable] |

### `PatchedInventoryGroupUpdate`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | No |  [readOnly] |
| `name` | `string` | No |  [nullable, maxLen=512] |
| `comment` | `string` | No |  [nullable, maxLen=512] |
| `category` | `integer` | No |  [nullable] |
| `unique_id` | `string` | No |  [nullable, maxLen=255] |
| `barcode` | `string` | No |  [nullable, maxLen=255] |
| `image` | `string(uri)` | No |  [nullable] |
| `extra` | `` | No |  |
| `published` | `boolean` | No |  |
| `type` | `Type9ddEnum` | No |  |
| `price` | `string(decimal)` | No |  |
| `discount` | `integer` | No |  [nullable] |
| `tarif_form` | `array[BaseInventoryTarifUpdate]` | No |  |
| `inventory_form` | `InventoryClone` | No |  |
| `unit_type` | `UnitTypeEnum` | No |  |
| `unit_price` | `string(decimal)` | No |  |
| `unit_count` | `string(decimal)` | No |  |
| `unit_sum` | `string(decimal)` | No |  |
| `points` | `array[integer]` | No |  |
| `lifetime` | `integer` | No |  [nullable] |

### `PatchedInventoryInsurance`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | No |  [readOnly] |
| `created_at` | `string(date-time)` | No |  [readOnly] |
| `updated_at` | `string(date-time)` | No |  [readOnly] |
| `type` | `InventoryInsuranceTypeEnum` | No |  |
| `company` | `string` | No |  [nullable, maxLen=255] |
| `number` | `string` | No |  [nullable, maxLen=255] |
| `amount` | `string(decimal)` | No |  |
| `start_at` | `string(date-time)` | No |  |
| `end_at` | `string(date-time)` | No |  |
| `tenant` | `integer` | No |  [readOnly] |
| `inventory` | `integer` | No |  [readOnly] |

### `PatchedInventorySet`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | No |  [readOnly] |
| `name` | `string` | No |  [maxLen=255] |
| `unique_id` | `string` | No |  [nullable, maxLen=255] |
| `image` | `string(uri)` | No |  [nullable] |
| `category` | `integer` | No |  [nullable] |
| `status` | `integer` | No |  [readOnly] |
| `price` | `string(decimal)` | No |  [nullable] |
| `discount` | `integer` | No |  [nullable] |
| `prices` | `array[InventorySetPrice]` | No |  [readOnly] |
| `items` | `array[InventorySetItem]` | No |  [readOnly] |
| `static` | `boolean` | No |  |
| `extra` | `` | No |  |
| `published` | `boolean` | No |  |
| `deleted` | `boolean` | No |  [readOnly] |

### `PatchedInventorySetItem`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | No |  |
| `count` | `integer` | No |  |
| `group_id` | `integer` | No |  |
| `group_name` | `string` | No |  [readOnly] |
| `group_unique_id` | `string` | No |  [readOnly] |
| `group_category` | `integer` | No |  [readOnly] |
| `group_image` | `string` | No |  [readOnly] |
| `inventories_count` | `integer` | No |  [readOnly, default=0] |
| `inventories_free` | `integer` | No |  [readOnly, default=0] |
| `alternative` | `integer` | No |  [nullable] |
| `required` | `boolean` | No |  |

### `PatchedInventorySetPriceSerializerV2`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | No |  [readOnly] |
| `name` | `string` | No |  [nullable, maxLen=255] |
| `period` | `integer` | No |  |
| `order` | `integer` | No |  |

### `PatchedInventoryTarif`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | No |  [readOnly] |
| `set_id` | `integer` | No |  [readOnly] |
| `group_id` | `integer` | No |  [readOnly] |
| `weekdays` | `array[integer]` | No |  |
| `created_at` | `string(date-time)` | No |  [readOnly] |
| `updated_at` | `string(date-time)` | No |  [readOnly] |
| `start` | `string(time)` | No |  [nullable] |
| `end` | `string(time)` | No |  [nullable] |
| `published` | `boolean` | No |  |
| `order` | `integer` | No |  |
| `name` | `string` | No |  [maxLen=255] |
| `price` | `string(decimal)` | No |  |
| `tenant` | `integer` | No |  |
| `inventory` | `integer` | No |  [nullable, readOnly] |
| `inventory_group` | `integer` | No |  [nullable] |
| `inventory_set` | `integer` | No |  [nullable, readOnly] |
| `inventory_set_price` | `integer` | No |  [nullable] |
| `time_period` | `integer` | No |  [nullable] |

### `PatchedService`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | No |  [readOnly] |
| `disabled` | `DisabledEnum | NullEnum` | No |  [nullable] |
| `tarifs` | `array[ServiceTarifs]` | No |  [readOnly] |
| `created_at` | `string(date-time)` | No |  [readOnly] |
| `updated_at` | `string(date-time)` | No |  [readOnly] |
| `name` | `string` | No |  [nullable, maxLen=255] |
| `type` | `ServiceTypeEnum` | No |  |
| `unique_id` | `string` | No |  [nullable, maxLen=255] |
| `bonus` | `string(decimal)` | No |  [nullable] |
| `extra` | `` | No |  |
| `slug` | `string` | No |  [nullable, maxLen=50] |
| `published` | `boolean` | No |  |
| `price` | `string(decimal)` | No |  |
| `image` | `string(uri)` | No |  [nullable] |
| `deleted` | `boolean` | No |  |
| `deleted_at` | `string(date-time)` | No |  [nullable] |
| `tenant` | `integer` | No |  |
| `category` | `integer` | No |  [nullable] |
| `discount` | `integer` | No |  [nullable] |

### `PatchedServiceTarifs`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | No |  [readOnly] |
| `created_at` | `string(date-time)` | No |  [readOnly] |
| `updated_at` | `string(date-time)` | No |  [readOnly] |
| `name` | `string` | No |  [nullable, maxLen=255] |
| `price` | `string(decimal)` | No |  |
| `one_time_payment` | `boolean` | No |  |
| `published` | `boolean` | No |  |
| `tenant` | `integer` | No |  |
| `service` | `integer` | No |  |
| `duriation` | `integer` | No |  [nullable] |

### `PatchedTarif`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | No |  [readOnly] |
| `created_at` | `string(date-time)` | No |  [readOnly] |
| `updated_at` | `string(date-time)` | No |  [readOnly] |
| `weekdays` | `array[integer]` | No |  |
| `start` | `string(time)` | No |  [nullable] |
| `end` | `string(time)` | No |  [nullable] |
| `published` | `boolean` | No |  |
| `order` | `integer` | No |  |
| `name` | `string` | No |  [maxLen=255] |
| `price` | `string(decimal)` | No |  |
| `tenant` | `integer` | No |  |
| `inventory` | `integer` | No |  [nullable] |
| `inventory_group` | `integer` | No |  [nullable] |
| `inventory_set` | `integer` | No |  [nullable] |
| `inventory_set_price` | `integer` | No |  [nullable] |
| `time_period` | `integer` | No |  [nullable] |

### `PeriodTypeEnum`

* `0` - interval
* `1` - distance

**Enum values:** `[0, 1]`

### `RequestStatusColorEnum`

* `exceed` - exceed
* `request` - Запрос
* `reserve` - reserve
* `inrent` - В аренде
* `cancel` - cancel
* `completed` - Завершено
* `debtor` - Должник

**Enum values:** `['exceed', 'request', 'reserve', 'inrent', 'cancel', 'completed', 'debtor']`

### `RequestStatusEnum`

* `0` - Запрос
* `1` - Забронировано
* `2` - В аренде
* `3` - Отменено
* `4` - Завершено
* `5` - Должник

**Enum values:** `[0, 1, 2, 3, 4, 5]`

### `Schedule`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | Yes |  [readOnly] |
| `inventory` | `integer` | No |  [nullable] |
| `request_id` | `integer` | Yes |  |
| `request_status_color` | `RequestStatusColorEnum` | Yes |  [readOnly] |
| `request_autorenewal` | `boolean` | Yes |  [readOnly] |
| `client` | `BaseClient` | Yes |  [readOnly] |
| `start_at` | `string(date-time)` | No |  [nullable] |
| `end_at` | `string(date-time)` | No |  [nullable] |
| `fact_start_at` | `string(date-time)` | No |  [nullable] |
| `fact_end_at` | `string(date-time)` | No |  [nullable] |
| `rent_start` | `string(date-time)` | Yes |  |
| `rent_fact_start` | `string(date-time)` | Yes |  |
| `rent_end` | `string(date-time)` | Yes |  |
| `rent_fact_end` | `string(date-time)` | Yes |  |
| `rent_price` | `string(decimal)` | No |  |
| `rent_price_discount` | `string(decimal)` | No |  |
| `rent_price_inventory` | `string(decimal)` | No |  |
| `rent_price_service` | `string(decimal)` | No |  |
| `rent_price_paid_amount` | `string(decimal)` | No |  |
| `deposits` | `array[OrderRequestDeposit]` | Yes |  [readOnly] |

### `Service`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | Yes |  [readOnly] |
| `disabled` | `DisabledEnum | NullEnum` | No |  [nullable] |
| `tarifs` | `array[ServiceTarifs]` | Yes |  [readOnly] |
| `created_at` | `string(date-time)` | Yes |  [readOnly] |
| `updated_at` | `string(date-time)` | Yes |  [readOnly] |
| `name` | `string` | No |  [nullable, maxLen=255] |
| `type` | `ServiceTypeEnum` | No |  |
| `unique_id` | `string` | No |  [nullable, maxLen=255] |
| `bonus` | `string(decimal)` | No |  [nullable] |
| `extra` | `` | No |  |
| `slug` | `string` | No |  [nullable, maxLen=50] |
| `published` | `boolean` | No |  |
| `price` | `string(decimal)` | No |  |
| `image` | `string(uri)` | No |  [nullable] |
| `deleted` | `boolean` | No |  |
| `deleted_at` | `string(date-time)` | No |  [nullable] |
| `tenant` | `integer` | No |  |
| `category` | `integer` | No |  [nullable] |
| `discount` | `integer` | No |  [nullable] |

### `ServiceGeneral`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `count` | `integer` | Yes |  |
| `amount` | `string(decimal)` | Yes |  [readOnly] |
| `amount_avg` | `string(decimal)` | Yes |  [readOnly] |

### `ServiceTarifs`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | Yes |  [readOnly] |
| `created_at` | `string(date-time)` | Yes |  [readOnly] |
| `updated_at` | `string(date-time)` | Yes |  [readOnly] |
| `name` | `string` | No |  [nullable, maxLen=255] |
| `price` | `string(decimal)` | No |  |
| `one_time_payment` | `boolean` | No |  |
| `published` | `boolean` | No |  |
| `tenant` | `integer` | No |  |
| `service` | `integer` | Yes |  |
| `duriation` | `integer` | No |  [nullable] |

### `ServiceTypeEnum`

* `0` - Доставка
* `1` - Не выбрано
* `2` - Доставка обратно
* `3` - Доставка туда и обратно
* `4` - workshop

**Enum values:** `[0, 1, 2, 3, 4]`

### `SideEnum`

* `0` - self
* `1` - foreign

**Enum values:** `[0, 1]`

### `SourceEnum`

* `0` - shop
* `1` - expense

**Enum values:** `[0, 1]`

### `StatusE96Enum`

* `0` - Свободно
* `1` - Забронировано
* `2` - В аренде
* `3` - Сломано
* `4` - Просрочка
* `5` - Не активна
* `6` - Продано
* `7` - repair
* `8` - written off
* `9` - warehouse
* `10` - Доставка
* `1

**Enum values:** `[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]`

### `Tarif`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | Yes |  [readOnly] |
| `created_at` | `string(date-time)` | Yes |  [readOnly] |
| `updated_at` | `string(date-time)` | Yes |  [readOnly] |
| `weekdays` | `array[integer]` | No |  |
| `start` | `string(time)` | No |  [nullable] |
| `end` | `string(time)` | No |  [nullable] |
| `published` | `boolean` | No |  |
| `order` | `integer` | No |  |
| `name` | `string` | No |  [maxLen=255] |
| `price` | `string(decimal)` | No |  |
| `tenant` | `integer` | No |  |
| `inventory` | `integer` | No |  [nullable] |
| `inventory_group` | `integer` | No |  [nullable] |
| `inventory_set` | `integer` | No |  [nullable] |
| `inventory_set_price` | `integer` | No |  [nullable] |
| `time_period` | `integer` | No |  [nullable] |

### `TarifBulkCreate`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `tarifs` | `array[TarifBulkCreateEntity]` | Yes |  |

### `TarifBulkCreateEntity`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `price` | `string(decimal)` | No |  |
| `weekdays` | `array[integer]` | No |  |
| `start` | `string(time)` | No |  [nullable] |
| `end` | `string(time)` | No |  [nullable] |
| `published` | `boolean` | No |  |
| `order` | `integer` | No |  |
| `name` | `string` | No |  [maxLen=255] |
| `inventory` | `integer` | No |  [nullable] |
| `inventory_group` | `integer` | No |  [nullable] |
| `inventory_set` | `integer` | No |  [nullable] |
| `inventory_set_price` | `integer` | No |  [nullable] |
| `time_period` | `integer` | No |  [nullable] |

### `TarifBulkUpdate`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `tarifs` | `array[TarifBulkUpdateEntity]` | Yes |  |

### `TarifBulkUpdateEntity`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | Yes |  |
| `price` | `string(decimal)` | Yes |  |
| `inventory` | `integer` | No |  [nullable] |
| `inventory_group` | `integer` | No |  [nullable] |
| `inventory_set` | `integer` | No |  [nullable] |
| `inventory_set_price` | `integer` | No |  [nullable] |
| `time_period` | `integer` | No |  [nullable] |

### `Type433Enum`

* `0` - Физ. лицо
* `1` - Юр. лицо

**Enum values:** `[0, 1]`

### `Type5b9Enum`

* `0` - one time
* `1` - periodic

**Enum values:** `[0, 1]`

### `Type6ecEnum`

* `0` - ИП
* `1` - ТОО
* `2` - АО
* `3` - ПК

**Enum values:** `[0, 1, 2, 3]`

### `Type9ddEnum`

* `0` - Аренда
* `1` - Продажа

**Enum values:** `[0, 1]`

### `Unavailable`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `request_id` | `integer` | Yes |  [nullable, readOnly] |
| `request_status` | `RequestStatusEnum` | No |  |
| `inventory` | `integer` | Yes |  |
| `start_at` | `string(date-time)` | Yes |  |
| `end_at` | `string(date-time)` | Yes |  |

### `UnitTypeEnum`

* `litre` - Litre
* `kg` - Kilogram
* `g` - Gram
* `ml` - Millilitre
* `piece` - Piece
* `m3` - Cubic Meter

**Enum values:** `['litre', 'kg', 'g', 'ml', 'piece', 'm3']`


---

# Orders / Requests

**Base path:** `/v1/crm/requests/`  
**Endpoints:** 44  
**Schemas:** 69

## Endpoint Summary

| Method | Path | Operation |
|--------|------|-----------|
| `GET` | `/v1/crm/requests/` | root_retrieve |
| `POST` | `/v1/crm/requests/` | root_create |
| `GET` | `/v1/crm/requests/amount/` | amount_retrieve |
| `GET` | `/v1/crm/requests/counts/` | counts_retrieve |
| `GET` | `/v1/crm/requests/deliveries/` | deliveries_retrieve |
| `GET` | `/v1/crm/requests/deliveries/count/` | deliveries_count_retrieve |
| `GET` | `/v1/crm/requests/inventories/` | inventories_list |
| `GET` | `/v1/crm/requests/inventories/count/` | inventories_count_retrieve |
| `GET` | `/v1/crm/requests/inventories/{id}/` | inventories_retrieve |
| `PUT` | `/v1/crm/requests/inventories/{id}/` | inventories_update |
| `PATCH` | `/v1/crm/requests/inventories/{id}/` | inventories_partial_update |
| `POST` | `/v1/crm/requests/inventories/{id}/action/` | inventories_action_create |
| `GET` | `/v1/crm/requests/schedule/` | schedule_list |
| `GET` | `/v1/crm/requests/{request_id}/` | root_retrieve_2 |
| `PUT` | `/v1/crm/requests/{request_id}/` | root_update |
| `PATCH` | `/v1/crm/requests/{request_id}/` | root_partial_update |
| `DELETE` | `/v1/crm/requests/{request_id}/` | root_destroy |
| `POST` | `/v1/crm/requests/{request_id}/action/` | action_create |
| `DELETE` | `/v1/crm/requests/{request_id}/archive/` | archive_destroy |
| `POST` | `/v1/crm/requests/{request_id}/create_bonus/` | create_bonus_create |
| `DELETE` | `/v1/crm/requests/{request_id}/delete_bonus/` | delete_bonus_destroy |
| `GET` | `/v1/crm/requests/{request_id}/deliveries/` | deliveries_retrieve_2 |
| `POST` | `/v1/crm/requests/{request_id}/deliveries/` | deliveries_create |
| `GET` | `/v1/crm/requests/{request_id}/deliveries/{id}/` | deliveries_retrieve_3 |
| `PUT` | `/v1/crm/requests/{request_id}/deliveries/{id}/` | deliveries_update |
| `PATCH` | `/v1/crm/requests/{request_id}/deliveries/{id}/` | deliveries_partial_update |
| `DELETE` | `/v1/crm/requests/{request_id}/deliveries/{id}/` | deliveries_destroy |
| `POST` | `/v1/crm/requests/{request_id}/deliveries/{id}/cancel/` | deliveries_cancel_create |
| `POST` | `/v1/crm/requests/{request_id}/deliveries/{id}/delivery/` | deliveries_delivery_create |
| `POST` | `/v1/crm/requests/{request_id}/deliveries/{id}/delivery/confirm/` | deliveries_delivery_confirm_create |
| `POST` | `/v1/crm/requests/{request_id}/deliveries/{id}/images/` | deliveries_images_create |
| `POST` | `/v1/crm/requests/{request_id}/deliveries/{id}/pickup/` | deliveries_pickup_create |
| `GET` | `/v1/crm/requests/{request_id}/deposits/` | deposits_list |
| `POST` | `/v1/crm/requests/{request_id}/deposits/` | deposits_create |
| `PUT` | `/v1/crm/requests/{request_id}/deposits/{id}/` | deposits_update |
| `PATCH` | `/v1/crm/requests/{request_id}/deposits/{id}/` | deposits_partial_update |
| `DELETE` | `/v1/crm/requests/{request_id}/deposits/{id}/` | deposits_destroy |
| `POST` | `/v1/crm/requests/{request_id}/deposits/{id}/return/` | deposits_return_create |
| `GET` | `/v1/crm/requests/{request_id}/discounts/` | discounts_retrieve |
| `POST` | `/v1/crm/requests/{request_id}/discounts/` | discounts_create |
| `PUT` | `/v1/crm/requests/{request_id}/discounts/{id}/` | discounts_update |
| `PATCH` | `/v1/crm/requests/{request_id}/discounts/{id}/` | discounts_partial_update |
| `DELETE` | `/v1/crm/requests/{request_id}/discounts/{id}/` | discounts_destroy |
| `GET` | `/v1/crm/requests/{request_id}/groups/` | groups_list |
| `POST` | `/v1/crm/requests/{request_id}/groups/` | groups_create |
| `GET` | `/v1/crm/requests/{request_id}/inventories/` | inventories_list_2 |
| `POST` | `/v1/crm/requests/{request_id}/inventories/bulk_create/` | inventories_bulk_create_create |
| `POST` | `/v1/crm/requests/{request_id}/inventories/bulk_delete/` | inventories_bulk_delete_create |
| `POST` | `/v1/crm/requests/{request_id}/inventories/bulk_update/` | inventories_bulk_update_create |
| `GET` | `/v1/crm/requests/{request_id}/pause/` | pause_retrieve |
| `POST` | `/v1/crm/requests/{request_id}/pause/` | pause_create |
| `GET` | `/v1/crm/requests/{request_id}/penalties/` | penalties_list |
| `POST` | `/v1/crm/requests/{request_id}/penalties/` | penalties_create |
| `PUT` | `/v1/crm/requests/{request_id}/penalties/{id}/` | penalties_update |
| `PATCH` | `/v1/crm/requests/{request_id}/penalties/{id}/` | penalties_partial_update |
| `DELETE` | `/v1/crm/requests/{request_id}/penalties/{id}/` | penalties_destroy |
| `POST` | `/v1/crm/requests/{request_id}/period/` | period_create |
| `GET` | `/v1/crm/requests/{request_id}/receipt/` | receipt_retrieve |
| `GET` | `/v1/crm/requests/{request_id}/referrals/` | referrals_list |
| `POST` | `/v1/crm/requests/{request_id}/referrals/` | referrals_create |
| `GET` | `/v1/crm/requests/{request_id}/referrals/{id}/` | referrals_retrieve |
| `PUT` | `/v1/crm/requests/{request_id}/referrals/{id}/` | referrals_update |
| `PATCH` | `/v1/crm/requests/{request_id}/referrals/{id}/` | referrals_partial_update |
| `DELETE` | `/v1/crm/requests/{request_id}/referrals/{id}/` | referrals_destroy |
| `POST` | `/v1/crm/requests/{request_id}/referrals/{id}/pay/` | referrals_pay_create |
| `GET` | `/v1/crm/requests/{request_id}/services/` | services_list |
| `POST` | `/v1/crm/requests/{request_id}/services/` | services_create |
| `PUT` | `/v1/crm/requests/{request_id}/services/{id}/` | services_update |
| `PATCH` | `/v1/crm/requests/{request_id}/services/{id}/` | services_partial_update |
| `DELETE` | `/v1/crm/requests/{request_id}/services/{id}/` | services_destroy |
| `GET` | `/v1/crm/requests/{request_id}/sets/` | sets_list |
| `POST` | `/v1/crm/requests/{request_id}/sets/` | sets_create |
| `GET` | `/v1/crm/requests/{request_id}/weekday/` | weekday_retrieve |
| `PUT` | `/v1/crm/requests/{request_id}/weekday/` | weekday_update |
| `PATCH` | `/v1/crm/requests/{request_id}/weekday/` | weekday_partial_update |

## Endpoint Details

### `GET` `/v1/crm/requests/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `end_at` | query | string | Yes |  |
| `start_at` | query | string | Yes |  |

**Response 200**: No response body

---

### `POST` `/v1/crm/requests/`

**Response 201**: No response body

---

### `GET` `/v1/crm/requests/amount/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `end_at` | query | string | Yes |  |
| `start_at` | query | string | Yes |  |

**Response 200**: `OrderRequestAmount`

---

### `GET` `/v1/crm/requests/counts/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `end_at` | query | string | Yes |  |
| `start_at` | query | string | Yes |  |

**Response 200**: `OrderRequestCount`

---

### `GET` `/v1/crm/requests/deliveries/`

**Response 200**: No response body

---

### `GET` `/v1/crm/requests/deliveries/count/`

**Response 200**: `OrderRequestDeliveryCount`

---

### `GET` `/v1/crm/requests/inventories/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `created_by` | query | integer | No |  |
| `date` | query | string | No |  |
| `discount` | query | integer | No |  |
| `id__in` | query | array | No | Несколько значений могут быть разделены запятыми. |
| `inventory` | query | integer | No |  |
| `issued` | query | boolean | No |  |
| `page` | query | integer | No | A page number within the paginated result set. |
| `pageSize` | query | integer | No | Number of results to return per page. |
| `received` | query | boolean | No |  |
| `search` | query | string | No | A search term. |
| `set` | query | integer | No |  |
| `status` | query | integer | No | * `0` - steady * `1` - issued * `2` - received * `3` - Просрочка |
| `tarif` | query | integer | No |  |
| `type` | query | integer | No | * `0` - Аренда * `1` - Продажа |

**Response 200**: `PaginatedInventoryRequestList`

---

### `GET` `/v1/crm/requests/inventories/count/`

**Response 200**: `InventoryRequestCount`

---

### `GET` `/v1/crm/requests/inventories/{id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `id` | path | integer | Yes |  |

**Response 200**: `InventoryRequest`

---

### `PUT` `/v1/crm/requests/inventories/{id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `id` | path | integer | Yes |  |

**Request Body** (`application/json`): `InventoryRequestDetail`

**Response 200**: `InventoryRequestDetail`

---

### `PATCH` `/v1/crm/requests/inventories/{id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `id` | path | integer | Yes |  |

**Request Body** (`application/json`): `PatchedInventoryRequestDetail`

**Response 200**: `InventoryRequestDetail`

---

### `POST` `/v1/crm/requests/inventories/{id}/action/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `id` | path | integer | Yes |  |

**Request Body** (`application/json`): `InventoryRequestAction`

**Response 201**: `InventoryRequestAction`

---

### `GET` `/v1/crm/requests/schedule/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `search` | query | string | No | A search term. |

**Response 200**: `array[OrderRequestSchedule]`

---

### `GET` `/v1/crm/requests/{request_id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `request_id` | path | integer | Yes |  |

**Response 200**: `OrderRequestDetail`

---

### `PUT` `/v1/crm/requests/{request_id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `request_id` | path | integer | Yes |  |

**Request Body** (`application/json`): `OrderRequestCreate`

**Response 200**: `OrderRequestCreate`

---

### `PATCH` `/v1/crm/requests/{request_id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `request_id` | path | integer | Yes |  |

**Request Body** (`application/json`): `PatchedOrderRequestCreate`

**Response 200**: `OrderRequestCreate`

---

### `DELETE` `/v1/crm/requests/{request_id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `request_id` | path | integer | Yes |  |

**Response 204**: No response body

---

### `POST` `/v1/crm/requests/{request_id}/action/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `request_id` | path | integer | Yes |  |

**Request Body** (`application/json`): `OrderAction`

**Response 201**: `OrderAction`

---

### `DELETE` `/v1/crm/requests/{request_id}/archive/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `request_id` | path | integer | Yes |  |

**Response 204**: No response body

---

### `POST` `/v1/crm/requests/{request_id}/create_bonus/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `request_id` | path | integer | Yes |  |

**Response 201**: No response body

---

### `DELETE` `/v1/crm/requests/{request_id}/delete_bonus/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `request_id` | path | integer | Yes |  |

**Response 204**: No response body

---

### `GET` `/v1/crm/requests/{request_id}/deliveries/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `request_id` | path | integer | Yes |  |

**Response 200**: No response body

---

### `POST` `/v1/crm/requests/{request_id}/deliveries/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `request_id` | path | integer | Yes |  |

**Response 201**: No response body

---

### `GET` `/v1/crm/requests/{request_id}/deliveries/{id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `id` | path | integer | Yes |  |
| `request_id` | path | integer | Yes |  |

**Response 200**: No response body

---

### `PUT` `/v1/crm/requests/{request_id}/deliveries/{id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `id` | path | integer | Yes |  |
| `request_id` | path | integer | Yes |  |

**Response 200**: No response body

---

### `PATCH` `/v1/crm/requests/{request_id}/deliveries/{id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `id` | path | integer | Yes |  |
| `request_id` | path | integer | Yes |  |

**Response 200**: No response body

---

### `DELETE` `/v1/crm/requests/{request_id}/deliveries/{id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `id` | path | integer | Yes |  |
| `request_id` | path | integer | Yes |  |

**Response 204**: No response body

---

### `POST` `/v1/crm/requests/{request_id}/deliveries/{id}/cancel/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `id` | path | integer | Yes |  |
| `request_id` | path | integer | Yes |  |

**Request Body** (`application/json`): `OrderRequestDeliveryCancel`

**Response 201**: `OrderRequestDeliveryCancel`

---

### `POST` `/v1/crm/requests/{request_id}/deliveries/{id}/delivery/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `id` | path | integer | Yes |  |
| `request_id` | path | integer | Yes |  |

**Response 201**: No response body

---

### `POST` `/v1/crm/requests/{request_id}/deliveries/{id}/delivery/confirm/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `id` | path | integer | Yes |  |
| `request_id` | path | integer | Yes |  |

**Request Body** (`application/json`): `OrderRequestDeliveryDelivered`

**Response 201**: `OrderRequestDeliveryDelivered`

---

### `POST` `/v1/crm/requests/{request_id}/deliveries/{id}/images/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `id` | path | integer | Yes |  |
| `request_id` | path | integer | Yes |  |

**Request Body** (`multipart/form-data`): `OrderRequestDeliveryImage`

**Response 201**: `OrderRequestDeliveryImage`

---

### `POST` `/v1/crm/requests/{request_id}/deliveries/{id}/pickup/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `id` | path | integer | Yes |  |
| `request_id` | path | integer | Yes |  |

**Response 201**: No response body

---

### `GET` `/v1/crm/requests/{request_id}/deposits/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `request_id` | path | integer | Yes |  |

**Response 200**: `array[OrderRequestDeposit]`

---

### `POST` `/v1/crm/requests/{request_id}/deposits/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `request_id` | path | integer | Yes |  |

**Request Body** (`application/json`): `OrderRequestDeposit`

**Response 201**: `OrderRequestDeposit`

---

### `PUT` `/v1/crm/requests/{request_id}/deposits/{id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `id` | path | integer | Yes |  |
| `request_id` | path | integer | Yes |  |

**Request Body** (`application/json`): `OrderRequestDeposit`

**Response 200**: `OrderRequestDeposit`

---

### `PATCH` `/v1/crm/requests/{request_id}/deposits/{id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `id` | path | integer | Yes |  |
| `request_id` | path | integer | Yes |  |

**Request Body** (`application/json`): `PatchedOrderRequestDeposit`

**Response 200**: `OrderRequestDeposit`

---

### `DELETE` `/v1/crm/requests/{request_id}/deposits/{id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `id` | path | integer | Yes |  |
| `request_id` | path | integer | Yes |  |

**Response 204**: No response body

---

### `POST` `/v1/crm/requests/{request_id}/deposits/{id}/return/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `id` | path | integer | Yes |  |
| `request_id` | path | integer | Yes |  |

**Response 201**: No response body

---

### `GET` `/v1/crm/requests/{request_id}/discounts/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `request_id` | path | integer | Yes |  |

**Response 200**: No response body

---

### `POST` `/v1/crm/requests/{request_id}/discounts/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `request_id` | path | integer | Yes |  |

**Response 201**: No response body

---

### `PUT` `/v1/crm/requests/{request_id}/discounts/{id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `id` | path | integer | Yes |  |
| `request_id` | path | integer | Yes |  |

**Response 200**: No response body

---

### `PATCH` `/v1/crm/requests/{request_id}/discounts/{id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `id` | path | integer | Yes |  |
| `request_id` | path | integer | Yes |  |

**Response 200**: No response body

---

### `DELETE` `/v1/crm/requests/{request_id}/discounts/{id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `id` | path | integer | Yes |  |
| `request_id` | path | integer | Yes |  |

**Response 204**: No response body

---

### `GET` `/v1/crm/requests/{request_id}/groups/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `request_id` | path | integer | Yes |  |

**Response 200**: `array[BaseInventoryGroup]`

---

### `POST` `/v1/crm/requests/{request_id}/groups/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `request_id` | path | integer | Yes |  |

**Request Body** (`application/json`): `OrderRequestInventoryGroupCreate`

**Response 201**: `OrderRequestInventoryGroupCreate`

---

### `GET` `/v1/crm/requests/{request_id}/inventories/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `request_id` | path | integer | Yes |  |

**Response 200**: `array[OrderRequestInventoryList]`

---

### `POST` `/v1/crm/requests/{request_id}/inventories/bulk_create/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `request_id` | path | integer | Yes |  |

**Request Body** (`application/json`): `OrderRequestInventoryBulkCreate`

**Response 201**: `OrderRequestInventoryBulkCreate`

---

### `POST` `/v1/crm/requests/{request_id}/inventories/bulk_delete/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `request_id` | path | integer | Yes |  |

**Request Body** (`application/json`): `OrderRequestInventoryBulkDelete`

**Response 201**: `OrderRequestInventoryBulkDelete`

---

### `POST` `/v1/crm/requests/{request_id}/inventories/bulk_update/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `request_id` | path | integer | Yes |  |

**Request Body** (`application/json`): `OrderRequestInventoryBulkUpdate`

**Response 201**: `OrderRequestInventoryBulkUpdate`

---

### `GET` `/v1/crm/requests/{request_id}/pause/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `request_id` | path | integer | Yes |  |

**Response 200**: `OrderRequestPause`

---

### `POST` `/v1/crm/requests/{request_id}/pause/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `request_id` | path | integer | Yes |  |

**Request Body** (`application/json`): `OrderRequestPause`

**Response 200**: `OrderRequestPause`

---

### `GET` `/v1/crm/requests/{request_id}/penalties/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `request_id` | path | integer | Yes |  |

**Response 200**: `array[OrderRequestPenalty]`

---

### `POST` `/v1/crm/requests/{request_id}/penalties/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `request_id` | path | integer | Yes |  |

**Request Body** (`application/json`): `OrderRequestPenalty`

**Response 201**: `OrderRequestPenalty`

---

### `PUT` `/v1/crm/requests/{request_id}/penalties/{id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `id` | path | integer | Yes |  |
| `request_id` | path | integer | Yes |  |

**Request Body** (`application/json`): `OrderRequestPenalty`

**Response 200**: `OrderRequestPenalty`

---

### `PATCH` `/v1/crm/requests/{request_id}/penalties/{id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `id` | path | integer | Yes |  |
| `request_id` | path | integer | Yes |  |

**Request Body** (`application/json`): `PatchedOrderRequestPenalty`

**Response 200**: `OrderRequestPenalty`

---

### `DELETE` `/v1/crm/requests/{request_id}/penalties/{id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `id` | path | integer | Yes |  |
| `request_id` | path | integer | Yes |  |

**Response 204**: No response body

---

### `POST` `/v1/crm/requests/{request_id}/period/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `request_id` | path | integer | Yes |  |

**Request Body** (`application/json`): `OrderRequestInventoryPeriodChange`

**Response 201**: `OrderRequestInventoryPeriodChange`

---

### `GET` `/v1/crm/requests/{request_id}/receipt/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `request_id` | path | integer | Yes |  |

**Response 200**: `OrderRequestReceipt`

---

### `GET` `/v1/crm/requests/{request_id}/referrals/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `request_id` | path | integer | Yes |  |

**Response 200**: `array[OrderRequestReferral]`

---

### `POST` `/v1/crm/requests/{request_id}/referrals/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `request_id` | path | integer | Yes |  |

**Request Body** (`application/json`): `OrderRequestReferral`

**Response 201**: `OrderRequestReferral`

---

### `GET` `/v1/crm/requests/{request_id}/referrals/{id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `id` | path | integer | Yes |  |
| `request_id` | path | integer | Yes |  |

**Response 200**: `OrderRequestReferral`

---

### `PUT` `/v1/crm/requests/{request_id}/referrals/{id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `id` | path | integer | Yes |  |
| `request_id` | path | integer | Yes |  |

**Request Body** (`application/json`): `OrderRequestReferral`

**Response 200**: `OrderRequestReferral`

---

### `PATCH` `/v1/crm/requests/{request_id}/referrals/{id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `id` | path | integer | Yes |  |
| `request_id` | path | integer | Yes |  |

**Request Body** (`application/json`): `PatchedOrderRequestReferral`

**Response 200**: `OrderRequestReferral`

---

### `DELETE` `/v1/crm/requests/{request_id}/referrals/{id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `id` | path | integer | Yes |  |
| `request_id` | path | integer | Yes |  |

**Response 204**: No response body

---

### `POST` `/v1/crm/requests/{request_id}/referrals/{id}/pay/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `id` | path | integer | Yes |  |
| `request_id` | path | integer | Yes |  |

**Response 201**: No response body

---

### `GET` `/v1/crm/requests/{request_id}/services/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `page` | query | integer | No | A page number within the paginated result set. |
| `pageSize` | query | integer | No | Number of results to return per page. |
| `request_id` | path | integer | Yes |  |

**Response 200**: `PaginatedDetailOrderRequestServiceList`

---

### `POST` `/v1/crm/requests/{request_id}/services/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `request_id` | path | integer | Yes |  |

**Request Body** (`application/json`): `OrderRequestServiceCreate`

**Response 201**: `OrderRequestServiceCreate`

---

### `PUT` `/v1/crm/requests/{request_id}/services/{id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `id` | path | integer | Yes |  |
| `request_id` | path | integer | Yes |  |

**Request Body** (`application/json`): `OrderRequestServiceCreate`

**Response 200**: `OrderRequestServiceCreate`

---

### `PATCH` `/v1/crm/requests/{request_id}/services/{id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `id` | path | integer | Yes |  |
| `request_id` | path | integer | Yes |  |

**Request Body** (`application/json`): `PatchedOrderRequestServiceCreate`

**Response 200**: `OrderRequestServiceCreate`

---

### `DELETE` `/v1/crm/requests/{request_id}/services/{id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `id` | path | integer | Yes |  |
| `request_id` | path | integer | Yes |  |

**Response 204**: No response body

---

### `GET` `/v1/crm/requests/{request_id}/sets/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `request_id` | path | integer | Yes |  |

**Response 200**: `array[InventorySetInfo]`

---

### `POST` `/v1/crm/requests/{request_id}/sets/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `request_id` | path | integer | Yes |  |

**Request Body** (`application/json`): `OrderRequestInventorySetCreate`

**Response 201**: `OrderRequestInventorySetCreate`

---

### `GET` `/v1/crm/requests/{request_id}/weekday/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `request_id` | path | integer | Yes |  |

**Response 200**: `OrderRequestWeekday`

---

### `PUT` `/v1/crm/requests/{request_id}/weekday/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `request_id` | path | integer | Yes |  |

**Request Body** (`application/json`): `OrderRequestWeekday`

**Response 200**: `OrderRequestWeekday`

---

### `PATCH` `/v1/crm/requests/{request_id}/weekday/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `request_id` | path | integer | Yes |  |

**Request Body** (`application/json`): `PatchedOrderRequestWeekday`

**Response 200**: `OrderRequestWeekday`

---

## Schemas

### `ActionEnum`

* `0` - reservation
* `1` - issue
* `2` - receivement
* `3` - cancel
* `4` - archive
* `5` - collect
* `6` - creation
* `7` - delivery pickup
* `8` - delivery issue

**Enum values:** `[0, 1, 2, 3, 4, 5, 6, 7, 8]`

### `BaseClient`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | Yes |  [readOnly] |
| `name` | `string` | Yes |  [maxLen=512] |
| `type` | `BaseClientTypeEnum` | No |  |
| `avatar` | `string(uri)` | No |  [nullable] |
| `agreement_id` | `string` | Yes |  [nullable, readOnly] |
| `signed` | `boolean` | No |  |
| `sign_date` | `string(date)` | No |  [nullable] |
| `sign_expires` | `string(date)` | No |  [nullable] |
| `phone` | `string` | Yes |  [maxLen=32] |
| `email` | `string(email)` | No |  [nullable, maxLen=254] |
| `legal_type` | `LegalTypeEnum | NullEnum` | No |  [nullable] |
| `extra` | `` | No |  |

### `BaseClientTypeEnum`

* `0` - Физ. лицо
* `1` - Юр. лицо

**Enum values:** `[0, 1]`

### `BaseInventory`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | Yes |  [readOnly] |
| `group` | `integer` | No |  [nullable] |
| `name` | `string` | Yes |  [maxLen=255] |
| `unique_id` | `string` | No |  [nullable, maxLen=255] |
| `category` | `integer` | Yes |  |
| `image` | `string(uri)` | No |  [nullable] |
| `extra` | `` | No |  |
| `sublease_user` | `integer` | No |  [nullable] |
| `state` | `integer` | No |  [nullable] |
| `disabled` | `DisabledEnum | NullEnum` | No |  [nullable] |
| `rental_point` | `integer` | Yes |  |

### `BaseInventoryGroup`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | Yes |  [readOnly] |
| `name` | `string` | No |  [nullable, maxLen=512] |
| `created_at` | `string(date-time)` | Yes |  [readOnly] |
| `deleted` | `boolean` | No |  |
| `updated_at` | `string(date-time)` | Yes |  [readOnly] |
| `category` | `integer` | No |  [nullable] |
| `unit_price` | `string(decimal)` | No |  |
| `unit_count` | `string(decimal)` | No |  |
| `unit_type` | `UnitTypeEnum` | No |  |
| `unit_sum` | `string(decimal)` | No |  |
| `image` | `string(uri)` | No |  [nullable] |
| `unique_id` | `string` | No |  [nullable, maxLen=255] |
| `barcode` | `string` | No |  [nullable, maxLen=255] |
| `extra` | `` | No |  |
| `filters` | `array[string]` | No |  [nullable] |
| `points` | `array[integer]` | No |  |
| `published` | `boolean` | No |  |
| `type` | `Type9ddEnum` | No |  |
| `price` | `string(decimal)` | No |  |
| `lifetime` | `integer` | No |  [nullable] |

### `CarInventory`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | Yes |  [readOnly] |
| `group` | `integer` | No |  [nullable] |
| `name` | `string` | Yes |  [maxLen=255] |
| `unique_id` | `string` | No |  [nullable, maxLen=255] |
| `category` | `integer` | Yes |  |
| `image` | `string(uri)` | No |  [nullable] |
| `extra` | `` | No |  |
| `sublease_user` | `integer` | No |  [nullable] |
| `state` | `integer` | No |  [nullable] |
| `disabled` | `DisabledEnum | NullEnum` | No |  [nullable] |
| `rental_point` | `integer` | Yes |  |
| `car` | `InventoryCar` | Yes |  [readOnly] |

### `DetailOrderRequestService`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | Yes |  [readOnly] |
| `service` | `Service` | Yes |  |
| `created_at` | `string(date-time)` | Yes |  [readOnly] |
| `updated_at` | `string(date-time)` | Yes |  [readOnly] |
| `tarif_price` | `string(decimal)` | No |  |
| `tarif_duration` | `string` | No |  |
| `start_at` | `string(date-time)` | No |  [nullable] |
| `end_at` | `string(date-time)` | No |  [nullable] |
| `price` | `string(decimal)` | No |  |
| `price_tax` | `string(decimal)` | No |  |
| `price_discount` | `string(decimal)` | No |  |
| `info` | `string` | No |  [nullable] |
| `extra` | `` | No |  |
| `tenant` | `integer` | No |  |
| `request` | `integer` | No |  [nullable] |
| `client` | `integer` | No |  [nullable] |
| `request_inventory` | `integer` | No |  [nullable] |
| `worker` | `integer` | No |  [nullable] |
| `tarif` | `integer` | No |  [nullable] |

### `DisabledEnum`

* `0` - delete
* `1` - archive
* `2` - withdraw

**Enum values:** `[0, 1, 2]`

### `InventoryCar`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | Yes |  [readOnly] |
| `brand` | `string` | No |  [nullable, maxLen=255] |
| `model` | `string` | No |  [nullable, maxLen=255] |
| `number` | `string` | Yes |  [maxLen=255] |
| `tech_passport` | `string` | Yes |  [maxLen=255] |

### `InventoryRequest`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | Yes |  [readOnly] |
| `status` | `StatusCbaEnum` | Yes |  [readOnly] |
| `inventory` | `BaseInventory` | Yes |  [readOnly] |
| `created_at` | `string(date-time)` | Yes |  [readOnly] |
| `updated_at` | `string(date-time)` | Yes |  [readOnly] |
| `type` | `Type9ddEnum` | Yes |  [readOnly] |
| `set_group` | `string` | No |  [nullable] |
| `tarif_price` | `string(decimal)` | No |  |
| `tarif_duration` | `string` | No |  |
| `additional_discount` | `string(decimal)` | No |  |
| `price` | `string(decimal)` | Yes |  [readOnly] |
| `price_tax` | `string(decimal)` | Yes |  [readOnly] |
| `price_discount` | `string(decimal)` | No |  |
| `penalty_amount` | `string(decimal)` | Yes |  [readOnly] |
| `penalty_auto` | `string(decimal)` | No |  |
| `penalty_custom` | `string(decimal)` | No |  |
| `bonus` | `string(decimal)` | Yes |  [readOnly] |
| `start_at` | `string(date-time)` | Yes |  [nullable, readOnly] |
| `end_at` | `string(date-time)` | Yes |  [nullable, readOnly] |
| `fact_start_at` | `string(date-time)` | Yes |  [nullable, readOnly] |
| `fact_end_at` | `string(date-time)` | Yes |  [nullable, readOnly] |
| `extra` | `` | No |  |
| `tenant` | `integer` | No |  |
| `exchange` | `integer` | No |  [nullable] |
| `request` | `integer` | Yes |  [readOnly] |
| `client` | `integer` | No |  [nullable] |
| `inventory_group` | `integer` | No |  [nullable] |
| `set` | `integer` | No |  [nullable] |
| `set_item` | `integer` | No |  [nullable] |
| `warehouse` | `integer` | No |  [nullable] |
| `counterparty` | `integer` | No |  [nullable] |
| `tarif` | `integer` | No |  [nullable] |
| `discount` | `integer` | No |  [nullable] |
| `created_by` | `integer` | Yes |  [nullable, readOnly] |

### `InventoryRequestAction`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `status` | `StatusCbaEnum` | Yes |  |
| `datetime` | `string(date-time)` | No |  [nullable] |

### `InventoryRequestCount`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `steady` | `integer` | Yes |  [readOnly] |
| `issue` | `integer` | Yes |  [readOnly] |
| `received` | `integer` | Yes |  [readOnly] |
| `overdue` | `integer` | Yes |  [readOnly] |

### `InventoryRequestDetail`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | Yes |  [readOnly] |
| `inventory` | `integer` | Yes |  |
| `created_at` | `string(date-time)` | Yes |  [readOnly] |
| `updated_at` | `string(date-time)` | Yes |  [readOnly] |
| `type` | `Type9ddEnum` | Yes |  [readOnly] |
| `set_group` | `string` | No |  [nullable] |
| `tarif_price` | `string(decimal)` | No |  |
| `tarif_duration` | `string` | No |  |
| `additional_discount` | `string(decimal)` | No |  |
| `price` | `string(decimal)` | Yes |  [readOnly] |
| `price_tax` | `string(decimal)` | Yes |  [readOnly] |
| `price_discount` | `string(decimal)` | No |  |
| `penalty_amount` | `string(decimal)` | Yes |  [readOnly] |
| `penalty_auto` | `string(decimal)` | No |  |
| `penalty_custom` | `string(decimal)` | No |  |
| `bonus` | `string(decimal)` | Yes |  [readOnly] |
| `start_at` | `string(date-time)` | Yes |  [nullable, readOnly] |
| `end_at` | `string(date-time)` | Yes |  [nullable, readOnly] |
| `fact_start_at` | `string(date-time)` | Yes |  [nullable, readOnly] |
| `fact_end_at` | `string(date-time)` | Yes |  [nullable, readOnly] |
| `extra` | `` | No |  |
| `tenant` | `integer` | No |  |
| `exchange` | `integer` | No |  [nullable] |
| `request` | `integer` | Yes |  [readOnly] |
| `client` | `integer` | No |  [nullable] |
| `inventory_group` | `integer` | No |  [nullable] |
| `set` | `integer` | No |  [nullable] |
| `set_item` | `integer` | No |  [nullable] |
| `warehouse` | `integer` | No |  [nullable] |
| `counterparty` | `integer` | No |  [nullable] |
| `tarif` | `integer` | No |  [nullable] |
| `discount` | `integer` | No |  [nullable] |
| `created_by` | `integer` | Yes |  [nullable, readOnly] |

### `InventorySetInfo`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | Yes |  [readOnly] |
| `name` | `string` | Yes |  [maxLen=255] |
| `unique_id` | `string` | No |  [nullable, maxLen=255] |
| `image` | `string(uri)` | No |  [nullable] |
| `category` | `integer` | No |  [nullable] |
| `static` | `boolean` | No |  |
| `extra` | `` | No |  |
| `published` | `boolean` | No |  |

### `LegalTypeEnum`

* `0` - ИП
* `1` - ТОО
* `2` - АО
* `3` - ПК

**Enum values:** `[0, 1, 2, 3]`

### `NullEnum`

**Enum values:** `[None]`

### `OrderAction`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `order_inventories` | `array[integer]` | No |  |
| `status` | `StatusC06Enum` | Yes |  |
| `action` | `ActionEnum` | No |  |
| `datetime` | `string(date-time)` | No |  [nullable] |

### `OrderRequestAction`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | Yes |  [readOnly] |
| `user` | `integer` | Yes |  |
| `created_at` | `string(date-time)` | Yes |  [readOnly] |
| `type` | `TypeFd0Enum` | Yes |  |
| `inventories` | `array[integer]` | Yes |  [readOnly] |

### `OrderRequestAmount`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `price_sum` | `string(decimal)` | Yes |  |
| `price_discount_sum` | `string(decimal)` | Yes |  |
| `tax_amount_sum` | `string(decimal)` | Yes |  |
| `paid_amount_sum` | `string(decimal)` | Yes |  |
| `debt_amount_sum` | `string(decimal)` | Yes |  |

### `OrderRequestCount`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `all` | `integer` | Yes |  |
| `request` | `integer` | Yes |  |
| `reserve` | `integer` | Yes |  |
| `inrent` | `integer` | Yes |  |
| `completed` | `integer` | Yes |  |
| `cancelled` | `integer` | Yes |  |
| `debtor` | `integer` | Yes |  |
| `exceed` | `integer` | Yes |  |
| `deleted` | `integer` | Yes |  |

### `OrderRequestCreate`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | Yes |  [readOnly] |
| `created_at` | `string(date-time)` | Yes |  [readOnly] |
| `updated_at` | `string(date-time)` | Yes |  [readOnly] |
| `plus_id` | `integer(int64)` | No |  [nullable] |
| `rent_start` | `string(date-time)` | No |  |
| `rent_end` | `string(date-time)` | No |  |
| `autorenewal` | `boolean` | No |  |
| `autowithdraw` | `boolean` | No |  |
| `counting_duration` | `string` | No |  [nullable] |
| `price_inventory_discount` | `string(decimal)` | No |  |
| `price_service_discount` | `string(decimal)` | No |  |
| `price_delivery` | `string(decimal)` | No |  |
| `price_referral` | `string(decimal)` | No |  |
| `tax_percent` | `string(decimal)` | No |  |
| `tax_included` | `boolean` | No |  |
| `price_tax` | `string(decimal)` | No |  |
| `discount_combine` | `boolean` | No |  |
| `additional_discount` | `string(decimal)` | No |  |
| `penalty_auto` | `string(decimal)` | No |  |
| `penalty_custom` | `string(decimal)` | No |  |
| `penalty_step_duriation` | `string` | No |  |
| `penalty_disabled` | `boolean` | No |  |
| `extra` | `` | No |  |
| `active` | `boolean` | No |  |
| `tenant` | `integer` | No |  |
| `client` | `integer` | No |  [nullable] |
| `discount` | `integer` | No |  [nullable] |
| `rental_point` | `integer` | No |  [nullable] |
| `rental_point_return` | `integer` | No |  [nullable] |
| `bag` | `string(uuid)` | No |  [nullable] |
| `default_tarif_period` | `integer` | No |  [nullable] |

### `OrderRequestDeliveryCancel`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `comment` | `string` | Yes |  |

### `OrderRequestDeliveryCount`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `pending` | `integer` | Yes |  |
| `in_progress` | `integer` | Yes |  |
| `done` | `integer` | Yes |  |

### `OrderRequestDeliveryDelivered`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `code` | `string` | No |  |

### `OrderRequestDeliveryImage`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `images` | `array[string(uri)]` | No |  |

### `OrderRequestDeposit`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | Yes |  [readOnly] |
| `created_by` | `integer` | Yes |  [readOnly] |
| `payment_type` | `integer` | No |  [nullable] |
| `type` | `OrderRequestDepositTypeEnum` | Yes |  |
| `status` | `OrderRequestDepositStatusEnum` | Yes |  |
| `request` | `integer` | Yes |  [readOnly] |
| `created_at` | `string(date-time)` | Yes |  [readOnly] |
| `deposit` | `string` | Yes |  [maxLen=255] |
| `amount` | `string(decimal)` | No |  |
| `returned_at` | `string(date-time)` | Yes |  [nullable, readOnly] |
| `transaction_amount` | `string(decimal)` | Yes |  [readOnly] |

### `OrderRequestDepositStatusEnum`

* `0` - DEFAULT
* `1` - RECEIVED
* `2` - RETURNED

**Enum values:** `[0, 1, 2]`

### `OrderRequestDepositTypeEnum`

* `0` - STRING
* `1` - AMOUNT

**Enum values:** `[0, 1]`

### `OrderRequestDetail`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | Yes |  [readOnly] |
| `services` | `array[DetailOrderRequestService]` | Yes |  |
| `actions` | `array[OrderRequestAction]` | Yes |  [readOnly] |
| `discount_type` | `integer` | Yes |  |
| `status_color` | `StatusColorEnum` | Yes |  [readOnly] |
| `pending_inventories` | `integer` | Yes |  [readOnly] |
| `inrent_inventories` | `integer` | Yes |  [readOnly] |
| `completed_inventories` | `integer` | Yes |  [readOnly] |
| `bonus_max` | `string(decimal)` | Yes |  [readOnly] |
| `bonus_used` | `string(decimal)` | Yes |  [readOnly] |
| `bonus_available` | `string(decimal)` | Yes |  [readOnly] |
| `created_at` | `string(date-time)` | Yes |  [readOnly] |
| `updated_at` | `string(date-time)` | Yes |  [readOnly] |
| `status` | `StatusC06Enum` | No |  |
| `plus_id` | `integer(int64)` | No |  [nullable] |
| `unique_id` | `string` | No |  [nullable, maxLen=64] |
| `rent_start` | `string(date-time)` | Yes |  |
| `rent_end` | `string(date-time)` | Yes |  |
| `rent_fact_start` | `string(date-time)` | No |  [nullable] |
| `rent_fact_end` | `string(date-time)` | No |  [nullable] |
| `autorenewal` | `boolean` | No |  |
| `autowithdraw` | `boolean` | No |  |
| `duriation` | `string` | No |  [nullable] |
| `initial_duriation` | `string` | No |  [nullable] |
| `counting_duration` | `string` | No |  [nullable] |
| `price` | `string(decimal)` | No |  |
| `price_discount` | `string(decimal)` | No |  |
| `price_inventory` | `string(decimal)` | No |  |
| `price_inventory_discount` | `string(decimal)` | No |  |
| `price_service` | `string(decimal)` | No |  |
| `price_service_discount` | `string(decimal)` | No |  |
| `price_delivery` | `string(decimal)` | No |  |
| `price_referral` | `string(decimal)` | No |  |
| `tax_percent` | `string(decimal)` | No |  |
| `tax_included` | `boolean` | No |  |
| `price_tax` | `string(decimal)` | No |  |
| `discount_amount` | `string(decimal)` | No |  |
| `discount_inventory_amount` | `string(decimal)` | No |  |
| `discount_service_amount` | `string(decimal)` | No |  |
| `discount_combine` | `boolean` | No |  |
| `additional_discount` | `string(decimal)` | No |  |
| `payment_status` | `PaymentStatusEnum` | No |  |
| `paid_amount` | `string(decimal)` | No |  |
| `time_exceed` | `boolean` | No |  |
| `penalty_amount` | `string(decimal)` | No |  |
| `penalty_auto` | `string(decimal)` | No |  |
| `penalty_custom` | `string(decimal)` | No |  |
| `penalty_duriation` | `string` | No |  [nullable] |
| `penalty_step_duriation` | `string` | No |  |
| `penalty_disabled` | `boolean` | No |  |
| `extra` | `` | No |  |
| `deleted` | `boolean` | No |  |
| `active` | `boolean` | No |  |
| `tenant` | `integer` | No |  |
| `client` | `integer` | No |  [nullable] |
| `discount` | `integer` | No |  [nullable] |
| `rental_point` | `integer` | No |  [nullable] |
| `rental_point_return` | `integer` | No |  [nullable] |
| `bag` | `string(uuid)` | No |  [nullable] |
| `default_tarif_period` | `integer` | No |  [nullable] |

### `OrderRequestInventoryBulkCreate`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `inventories` | `array[OrderRequestInventoryCreate]` | Yes |  |

### `OrderRequestInventoryBulkDelete`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `ids` | `array[integer]` | Yes |  |

### `OrderRequestInventoryBulkUpdate`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `inventories` | `array[OrderRequestInventoryUpdate]` | Yes |  |

### `OrderRequestInventoryCreate`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `type` | `integer` | No |  [default=0] |
| `set` | `integer` | No |  [nullable] |
| `set_group` | `string` | No |  [nullable] |
| `inventory_group` | `integer` | No |  [nullable] |
| `inventory` | `integer` | No |  [nullable] |
| `tarif` | `integer` | Yes |  [nullable] |
| `tarif_price` | `string(decimal)` | No |  |
| `tarif_duration` | `string` | No |  |
| `start_at` | `string(date-time)` | Yes |  |
| `end_at` | `string(date-time)` | Yes |  |
| `extra` | `` | No |  |
| `warehouse` | `integer` | No |  [nullable] |
| `counterparty` | `integer` | No |  [nullable] |
| `discount` | `integer` | No |  [nullable] |
| `additional_discount` | `string(decimal)` | No |  [nullable, default=0.00] |

### `OrderRequestInventoryGroupCreate`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `time_period` | `integer` | No |  [nullable] |
| `group` | `integer` | No |  [nullable] |
| `start_at` | `string(date-time)` | Yes |  |
| `end_at` | `string(date-time)` | Yes |  |
| `count` | `integer` | No |  [default=1] |
| `filter` | `` | No |  [nullable] |
| `filter_exact` | `boolean` | No |  [default=False] |
| `exclude_ids` | `array[integer]` | Yes |  |
| `inventory_id` | `integer` | No |  |
| `set_id` | `string` | No |  |

### `OrderRequestInventoryList`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | Yes |  [readOnly] |
| `inventory_group` | `integer` | No |  [nullable] |
| `inventory` | `CarInventory` | Yes |  [readOnly] |
| `tarif` | `integer` | No |  [nullable] |
| `tarif_price` | `string(decimal)` | No |  |
| `tarif_duration` | `string` | No |  |
| `discount` | `integer` | No |  [nullable] |
| `additional_discount` | `string(decimal)` | No |  |
| `set` | `integer` | No |  [nullable] |
| `price` | `string(decimal)` | No |  |
| `price_discount` | `string(decimal)` | No |  |
| `penalty_amount` | `string(decimal)` | No |  |
| `start_at` | `string(date-time)` | No |  [nullable] |
| `end_at` | `string(date-time)` | No |  [nullable] |
| `fact_start_at` | `string(date-time)` | No |  [nullable] |
| `fact_end_at` | `string(date-time)` | No |  [nullable] |
| `set_group` | `string` | No |  [nullable] |
| `extra` | `` | No |  |
| `type` | `Type9ddEnum` | No |  |
| `created_by` | `integer` | No |  [nullable] |
| `warehouse` | `integer` | No |  [nullable] |
| `counterparty` | `integer` | No |  [nullable] |
| `exchange` | `integer` | No |  [nullable] |

### `OrderRequestInventoryPeriodChange`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `time_period` | `integer` | Yes |  [nullable] |
| `inventory_ids` | `array[integer]` | Yes |  |
| `sets` | `array[OrderRequestInventorySetPeriodChange]` | Yes |  |

### `OrderRequestInventorySetCreate`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `time_period` | `integer` | No |  [nullable] |
| `set` | `integer` | Yes |  |
| `start_at` | `string(date-time)` | Yes |  |
| `end_at` | `string(date-time)` | Yes |  |
| `exclude_ids` | `array[integer]` | Yes |  |
| `filters` | `array[OrderRequestInventorySetCreateFilter]` | Yes |  |

### `OrderRequestInventorySetCreateFilter`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `count` | `integer` | No |  [default=1] |
| `filter` | `` | No |  |

### `OrderRequestInventorySetPeriodChange`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `set_id` | `integer` | Yes |  |
| `inventory_ids` | `array[integer]` | Yes |  |

### `OrderRequestInventoryUpdate`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `type` | `integer` | No |  [default=0] |
| `set` | `integer` | No |  [nullable] |
| `set_group` | `string` | No |  [nullable] |
| `inventory_group` | `integer` | No |  [nullable] |
| `inventory` | `integer` | No |  [nullable] |
| `tarif` | `integer` | Yes |  [nullable] |
| `tarif_price` | `string(decimal)` | No |  |
| `tarif_duration` | `string` | No |  |
| `start_at` | `string(date-time)` | Yes |  |
| `end_at` | `string(date-time)` | Yes |  |
| `extra` | `` | No |  |
| `warehouse` | `integer` | No |  [nullable] |
| `counterparty` | `integer` | No |  [nullable] |
| `discount` | `integer` | No |  [nullable] |
| `additional_discount` | `string(decimal)` | No |  [nullable, default=0.00] |
| `id` | `integer` | Yes |  |

### `OrderRequestPause`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | Yes |  [readOnly] |
| `created_at` | `string(date-time)` | Yes |  [readOnly] |
| `updated_at` | `string(date-time)` | Yes |  [readOnly] |
| `start_at` | `string(date-time)` | Yes |  |
| `end_at` | `string(date-time)` | No |  [nullable] |
| `tenant` | `integer` | No |  |
| `request` | `integer` | Yes |  |
| `created_by` | `integer` | No |  [nullable] |

### `OrderRequestPenalty`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | Yes |  [readOnly] |
| `request_status` | `integer` | Yes |  [readOnly] |
| `created_at` | `string(date-time)` | Yes |  [readOnly] |
| `updated_at` | `string(date-time)` | Yes |  [readOnly] |
| `type` | `OrderRequestPenaltyTypeEnum` | Yes |  [readOnly] |
| `amount` | `string(decimal)` | No |  |
| `amount_paid` | `string(decimal)` | No |  |
| `reason` | `string` | No |  [nullable, maxLen=512] |
| `custom` | `boolean` | No |  |
| `tenant` | `integer` | No |  |
| `request` | `integer` | Yes |  [readOnly] |
| `request_inventory` | `integer` | No |  [nullable] |
| `created_by` | `integer` | Yes |  [nullable, readOnly] |
| `penalty` | `integer` | No |  [nullable] |

### `OrderRequestPenaltyTypeEnum`

* `0` - AUTO
* `1` - MANUAL

**Enum values:** `[0, 1]`

### `OrderRequestReceipt`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | Yes |  |
| `unique_id` | `string` | No |  |
| `manager` | `string` | Yes |  |
| `client_name` | `string` | Yes |  [readOnly] |
| `client_phone` | `string` | Yes |  [readOnly] |
| `rent_start` | `string(date-time)` | Yes |  |
| `rent_end` | `string(date-time)` | Yes |  |
| `price` | `string(decimal)` | No |  [default=0.00] |
| `price_discount` | `string(decimal)` | No |  [default=0.00] |
| `discount_amount` | `string(decimal)` | No |  [default=0.00] |
| `paid_amount` | `string(decimal)` | No |  [default=0.00] |
| `date` | `string(date-time)` | Yes |  |
| `comment_list` | `array[string]` | Yes |  [readOnly] |
| `rental_point_name` | `string` | Yes |  [readOnly] |
| `rental_point_address` | `string` | Yes |  [readOnly] |
| `deposit` | `integer` | Yes |  |
| `groups` | `array[ReceiptRow]` | Yes |  [readOnly] |
| `sets` | `array[ReceiptRow]` | Yes |  [readOnly] |
| `services` | `array[ReceiptRow]` | Yes |  [readOnly] |

### `OrderRequestReferral`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | Yes |  [readOnly] |
| `created_at` | `string(date-time)` | Yes |  [readOnly] |
| `request` | `integer` | Yes |  [readOnly] |
| `agent` | `integer` | No |  [nullable] |
| `amount` | `string(decimal)` | No |  |
| `status` | `OrderRequestReferralStatusEnum` | Yes |  [readOnly] |
| `status_changed_at` | `string(date-time)` | Yes |  [nullable, readOnly] |
| `request_status` | `integer` | Yes |  [readOnly] |

### `OrderRequestReferralStatusEnum`

* `0` - paid
* `1` - pending

**Enum values:** `[0, 1]`

### `OrderRequestSchedule`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | Yes |  [readOnly] |
| `client` | `BaseClient` | Yes |  |
| `status` | `StatusC06Enum` | No |  |
| `rent_start` | `string(date-time)` | Yes |  |
| `rent_fact_start` | `string(date-time)` | No |  [nullable] |
| `rent_end` | `string(date-time)` | Yes |  |
| `rent_fact_end` | `string(date-time)` | No |  [nullable] |
| `price` | `string(decimal)` | No |  |
| `price_discount` | `string(decimal)` | No |  |
| `price_inventory` | `string(decimal)` | No |  |
| `price_service` | `string(decimal)` | No |  |
| `discount_amount` | `string(decimal)` | No |  |
| `discount_inventory_amount` | `string(decimal)` | No |  |
| `discount_service_amount` | `string(decimal)` | No |  |
| `payment_status` | `PaymentStatusEnum` | No |  |
| `paid_amount` | `string(decimal)` | No |  |
| `time_exceed` | `boolean` | No |  |
| `penalty_amount` | `string(decimal)` | No |  |
| `status_color` | `StatusColorEnum` | Yes |  [readOnly] |
| `rental_point` | `integer` | No |  [nullable] |
| `created_at` | `string(date-time)` | Yes |  [readOnly] |
| `updated_at` | `string(date-time)` | Yes |  [readOnly] |
| `deleted` | `boolean` | No |  |
| `plus_id` | `integer(int64)` | No |  [nullable] |
| `extra` | `` | No |  |
| `autorenewal` | `boolean` | No |  |

### `OrderRequestServiceCreate`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | Yes |  [readOnly] |
| `created_at` | `string(date-time)` | Yes |  [readOnly] |
| `updated_at` | `string(date-time)` | Yes |  [readOnly] |
| `tarif_price` | `string(decimal)` | No |  |
| `tarif_duration` | `string` | No |  |
| `start_at` | `string(date-time)` | No |  [nullable] |
| `end_at` | `string(date-time)` | No |  [nullable] |
| `price` | `string(decimal)` | No |  |
| `price_tax` | `string(decimal)` | No |  |
| `price_discount` | `string(decimal)` | No |  |
| `info` | `string` | No |  [nullable] |
| `extra` | `` | No |  |
| `tenant` | `integer` | No |  |
| `request` | `integer` | No |  [nullable] |
| `client` | `integer` | No |  [nullable] |
| `request_inventory` | `integer` | No |  [nullable] |
| `service` | `integer` | Yes |  |
| `worker` | `integer` | No |  [nullable] |
| `tarif` | `integer` | No |  [nullable] |

### `OrderRequestWeekday`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `work_days` | `integer` | No |  |
| `rest_days` | `integer` | No |  |
| `rest_weekdays` | `array[integer]` | No |  |
| `custom` | `boolean` | No |  |
| `exclude_rest` | `boolean` | No |  |

### `PaginatedDetailOrderRequestServiceList`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `count` | `integer` | Yes |  |
| `next` | `string(uri)` | No |  [nullable] |
| `previous` | `string(uri)` | No |  [nullable] |
| `results` | `array[DetailOrderRequestService]` | Yes |  |

### `PaginatedInventoryRequestList`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `count` | `integer` | Yes |  |
| `next` | `string(uri)` | No |  [nullable] |
| `previous` | `string(uri)` | No |  [nullable] |
| `results` | `array[InventoryRequest]` | Yes |  |

### `PatchedInventoryRequestDetail`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | No |  [readOnly] |
| `inventory` | `integer` | No |  |
| `created_at` | `string(date-time)` | No |  [readOnly] |
| `updated_at` | `string(date-time)` | No |  [readOnly] |
| `type` | `Type9ddEnum` | No |  [readOnly] |
| `set_group` | `string` | No |  [nullable] |
| `tarif_price` | `string(decimal)` | No |  |
| `tarif_duration` | `string` | No |  |
| `additional_discount` | `string(decimal)` | No |  |
| `price` | `string(decimal)` | No |  [readOnly] |
| `price_tax` | `string(decimal)` | No |  [readOnly] |
| `price_discount` | `string(decimal)` | No |  |
| `penalty_amount` | `string(decimal)` | No |  [readOnly] |
| `penalty_auto` | `string(decimal)` | No |  |
| `penalty_custom` | `string(decimal)` | No |  |
| `bonus` | `string(decimal)` | No |  [readOnly] |
| `start_at` | `string(date-time)` | No |  [nullable, readOnly] |
| `end_at` | `string(date-time)` | No |  [nullable, readOnly] |
| `fact_start_at` | `string(date-time)` | No |  [nullable, readOnly] |
| `fact_end_at` | `string(date-time)` | No |  [nullable, readOnly] |
| `extra` | `` | No |  |
| `tenant` | `integer` | No |  |
| `exchange` | `integer` | No |  [nullable] |
| `request` | `integer` | No |  [readOnly] |
| `client` | `integer` | No |  [nullable] |
| `inventory_group` | `integer` | No |  [nullable] |
| `set` | `integer` | No |  [nullable] |
| `set_item` | `integer` | No |  [nullable] |
| `warehouse` | `integer` | No |  [nullable] |
| `counterparty` | `integer` | No |  [nullable] |
| `tarif` | `integer` | No |  [nullable] |
| `discount` | `integer` | No |  [nullable] |
| `created_by` | `integer` | No |  [nullable, readOnly] |

### `PatchedOrderRequestCreate`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | No |  [readOnly] |
| `created_at` | `string(date-time)` | No |  [readOnly] |
| `updated_at` | `string(date-time)` | No |  [readOnly] |
| `plus_id` | `integer(int64)` | No |  [nullable] |
| `rent_start` | `string(date-time)` | No |  |
| `rent_end` | `string(date-time)` | No |  |
| `autorenewal` | `boolean` | No |  |
| `autowithdraw` | `boolean` | No |  |
| `counting_duration` | `string` | No |  [nullable] |
| `price_inventory_discount` | `string(decimal)` | No |  |
| `price_service_discount` | `string(decimal)` | No |  |
| `price_delivery` | `string(decimal)` | No |  |
| `price_referral` | `string(decimal)` | No |  |
| `tax_percent` | `string(decimal)` | No |  |
| `tax_included` | `boolean` | No |  |
| `price_tax` | `string(decimal)` | No |  |
| `discount_combine` | `boolean` | No |  |
| `additional_discount` | `string(decimal)` | No |  |
| `penalty_auto` | `string(decimal)` | No |  |
| `penalty_custom` | `string(decimal)` | No |  |
| `penalty_step_duriation` | `string` | No |  |
| `penalty_disabled` | `boolean` | No |  |
| `extra` | `` | No |  |
| `active` | `boolean` | No |  |
| `tenant` | `integer` | No |  |
| `client` | `integer` | No |  [nullable] |
| `discount` | `integer` | No |  [nullable] |
| `rental_point` | `integer` | No |  [nullable] |
| `rental_point_return` | `integer` | No |  [nullable] |
| `bag` | `string(uuid)` | No |  [nullable] |
| `default_tarif_period` | `integer` | No |  [nullable] |

### `PatchedOrderRequestDeposit`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | No |  [readOnly] |
| `created_by` | `integer` | No |  [readOnly] |
| `payment_type` | `integer` | No |  [nullable] |
| `type` | `OrderRequestDepositTypeEnum` | No |  |
| `status` | `OrderRequestDepositStatusEnum` | No |  |
| `request` | `integer` | No |  [readOnly] |
| `created_at` | `string(date-time)` | No |  [readOnly] |
| `deposit` | `string` | No |  [maxLen=255] |
| `amount` | `string(decimal)` | No |  |
| `returned_at` | `string(date-time)` | No |  [nullable, readOnly] |
| `transaction_amount` | `string(decimal)` | No |  [readOnly] |

### `PatchedOrderRequestPenalty`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | No |  [readOnly] |
| `request_status` | `integer` | No |  [readOnly] |
| `created_at` | `string(date-time)` | No |  [readOnly] |
| `updated_at` | `string(date-time)` | No |  [readOnly] |
| `type` | `OrderRequestPenaltyTypeEnum` | No |  [readOnly] |
| `amount` | `string(decimal)` | No |  |
| `amount_paid` | `string(decimal)` | No |  |
| `reason` | `string` | No |  [nullable, maxLen=512] |
| `custom` | `boolean` | No |  |
| `tenant` | `integer` | No |  |
| `request` | `integer` | No |  [readOnly] |
| `request_inventory` | `integer` | No |  [nullable] |
| `created_by` | `integer` | No |  [nullable, readOnly] |
| `penalty` | `integer` | No |  [nullable] |

### `PatchedOrderRequestReferral`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | No |  [readOnly] |
| `created_at` | `string(date-time)` | No |  [readOnly] |
| `request` | `integer` | No |  [readOnly] |
| `agent` | `integer` | No |  [nullable] |
| `amount` | `string(decimal)` | No |  |
| `status` | `OrderRequestReferralStatusEnum` | No |  [readOnly] |
| `status_changed_at` | `string(date-time)` | No |  [nullable, readOnly] |
| `request_status` | `integer` | No |  [readOnly] |

### `PatchedOrderRequestServiceCreate`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | No |  [readOnly] |
| `created_at` | `string(date-time)` | No |  [readOnly] |
| `updated_at` | `string(date-time)` | No |  [readOnly] |
| `tarif_price` | `string(decimal)` | No |  |
| `tarif_duration` | `string` | No |  |
| `start_at` | `string(date-time)` | No |  [nullable] |
| `end_at` | `string(date-time)` | No |  [nullable] |
| `price` | `string(decimal)` | No |  |
| `price_tax` | `string(decimal)` | No |  |
| `price_discount` | `string(decimal)` | No |  |
| `info` | `string` | No |  [nullable] |
| `extra` | `` | No |  |
| `tenant` | `integer` | No |  |
| `request` | `integer` | No |  [nullable] |
| `client` | `integer` | No |  [nullable] |
| `request_inventory` | `integer` | No |  [nullable] |
| `service` | `integer` | No |  |
| `worker` | `integer` | No |  [nullable] |
| `tarif` | `integer` | No |  [nullable] |

### `PatchedOrderRequestWeekday`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `work_days` | `integer` | No |  |
| `rest_days` | `integer` | No |  |
| `rest_weekdays` | `array[integer]` | No |  |
| `custom` | `boolean` | No |  |
| `exclude_rest` | `boolean` | No |  |

### `PaymentStatusEnum`

* `0` - Ожидается оплата
* `1` - Оплата произведена
* `2` - Частичная оплата

**Enum values:** `[0, 1, 2]`

### `ReceiptRow`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `object_id` | `integer` | Yes |  |
| `name` | `string` | Yes |  |
| `count` | `integer` | Yes |  |
| `price` | `string(decimal)` | Yes |  |
| `price_discount` | `string(decimal)` | Yes |  |

### `Service`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | Yes |  [readOnly] |
| `disabled` | `DisabledEnum | NullEnum` | No |  [nullable] |
| `tarifs` | `array[ServiceTarifs]` | Yes |  [readOnly] |
| `created_at` | `string(date-time)` | Yes |  [readOnly] |
| `updated_at` | `string(date-time)` | Yes |  [readOnly] |
| `name` | `string` | No |  [nullable, maxLen=255] |
| `type` | `ServiceTypeEnum` | No |  |
| `unique_id` | `string` | No |  [nullable, maxLen=255] |
| `bonus` | `string(decimal)` | No |  [nullable] |
| `extra` | `` | No |  |
| `slug` | `string` | No |  [nullable, maxLen=50] |
| `published` | `boolean` | No |  |
| `price` | `string(decimal)` | No |  |
| `image` | `string(uri)` | No |  [nullable] |
| `deleted` | `boolean` | No |  |
| `deleted_at` | `string(date-time)` | No |  [nullable] |
| `tenant` | `integer` | No |  |
| `category` | `integer` | No |  [nullable] |
| `discount` | `integer` | No |  [nullable] |

### `ServiceTarifs`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | Yes |  [readOnly] |
| `created_at` | `string(date-time)` | Yes |  [readOnly] |
| `updated_at` | `string(date-time)` | Yes |  [readOnly] |
| `name` | `string` | No |  [nullable, maxLen=255] |
| `price` | `string(decimal)` | No |  |
| `one_time_payment` | `boolean` | No |  |
| `published` | `boolean` | No |  |
| `tenant` | `integer` | No |  |
| `service` | `integer` | Yes |  |
| `duriation` | `integer` | No |  [nullable] |

### `ServiceTypeEnum`

* `0` - Доставка
* `1` - Не выбрано
* `2` - Доставка обратно
* `3` - Доставка туда и обратно
* `4` - workshop

**Enum values:** `[0, 1, 2, 3, 4]`

### `StatusC06Enum`

* `0` - Запрос
* `1` - Забронировано
* `2` - В аренде
* `3` - Отменено
* `4` - Завершено
* `5` - Должник

**Enum values:** `[0, 1, 2, 3, 4, 5]`

### `StatusCbaEnum`

* `0` - steady
* `1` - issued
* `2` - received
* `3` - Просрочка

**Enum values:** `[0, 1, 2, 3]`

### `StatusColorEnum`

* `exceed` - exceed
* `request` - Запрос
* `reserve` - reserve
* `inrent` - В аренде
* `cancel` - cancel
* `completed` - Завершено
* `debtor` - Должник

**Enum values:** `['exceed', 'request', 'reserve', 'inrent', 'cancel', 'completed', 'debtor']`

### `Type9ddEnum`

* `0` - Аренда
* `1` - Продажа

**Enum values:** `[0, 1]`

### `TypeFd0Enum`

* `0` - reservation
* `1` - issue
* `2` - receivement
* `3` - cancel
* `4` - archive
* `5` - collect
* `6` - creation
* `7` - delivery pickup
* `8` - delivery issue

**Enum values:** `[0, 1, 2, 3, 4, 5, 6, 7, 8]`

### `UnitTypeEnum`

* `litre` - Litre
* `kg` - Kilogram
* `g` - Gram
* `ml` - Millilitre
* `piece` - Piece
* `m3` - Cubic Meter

**Enum values:** `['litre', 'kg', 'g', 'ml', 'piece', 'm3']`


---

# Documents

**Base path:** `/v2/documents/`  
**Endpoints:** 20  
**Schemas:** 27

## Endpoint Summary

| Method | Path | Operation |
|--------|------|-----------|
| `GET` | `/v2/documents/` | root_list |
| `POST` | `/v2/documents/` | root_create |
| `GET` | `/v2/documents/templates/` | templates_list |
| `POST` | `/v2/documents/templates/` | templates_create |
| `GET` | `/v2/documents/templates/{id}/` | templates_retrieve |
| `PUT` | `/v2/documents/templates/{id}/` | templates_update |
| `PATCH` | `/v2/documents/templates/{id}/` | templates_partial_update |
| `DELETE` | `/v2/documents/templates/{id}/` | templates_destroy |
| `GET` | `/v2/documents/{document_id}/` | root_retrieve |
| `PUT` | `/v2/documents/{document_id}/` | root_update |
| `PATCH` | `/v2/documents/{document_id}/` | root_partial_update |
| `DELETE` | `/v2/documents/{document_id}/` | root_destroy |
| `GET` | `/v2/documents/{document_id}/company/` | company_retrieve |
| `POST` | `/v2/documents/{document_id}/documents/` | documents_create |
| `POST` | `/v2/documents/{document_id}/documents/refresh/` | documents_refresh_create |
| `GET` | `/v2/documents/{document_id}/documents/{file_id}/` | documents_retrieve |
| `POST` | `/v2/documents/{document_id}/eds_sign/{sign_id}/` | eds_sign_create |
| `POST` | `/v2/documents/{document_id}/manual_sign/` | manual_sign_create |
| `POST` | `/v2/documents/{document_id}/signs/` | signs_create |
| `PUT` | `/v2/documents/{document_id}/signs/{sign_id}/` | signs_update |
| `PATCH` | `/v2/documents/{document_id}/signs/{sign_id}/` | signs_partial_update |
| `DELETE` | `/v2/documents/{document_id}/signs/{sign_id}/` | signs_destroy |
| `POST` | `/v2/documents/{document_id}/signs/{sign_id}/sms/` | signs_sms_create |
| `GET` | `/v2/documents/{document_uuid}/` | root_retrieve_2 |
| `GET` | `/v2/documents/{document_uuid}/documents/{file_id}/` | documents_retrieve_2 |
| `POST` | `/v2/documents/{document_uuid}/eds/` | eds_create |
| `GET` | `/v2/documents/{document_uuid}/egov/` | egov_retrieve |
| `GET` | `/v2/documents/{document_uuid}/egov/confirm/` | egov_confirm_retrieve |
| `PUT` | `/v2/documents/{document_uuid}/egov/confirm/` | egov_confirm_update |
| `PATCH` | `/v2/documents/{document_uuid}/egov/confirm/` | egov_confirm_partial_update |
| `POST` | `/v2/documents/{document_uuid}/sign/` | sign_create |
| `POST` | `/v2/documents/{document_uuid}/sign/confirm/` | sign_confirm_create |

## Endpoint Details

### `GET` `/v2/documents/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `page` | query | integer | No | A page number within the paginated result set. |
| `pageSize` | query | integer | No | Number of results to return per page. |
| `search` | query | string | No | A search term. |

**Response 200**: `PaginatedDocumentV2List`

---

### `POST` `/v2/documents/`

**Request Body** (`multipart/form-data`): `DocumentV2`

**Response 201**: `DocumentV2`

---

### `GET` `/v2/documents/templates/`

**Response 200**: `array[TemplateV2]`

---

### `POST` `/v2/documents/templates/`

**Request Body** (`application/json`): `TemplateV2Detail`

**Response 201**: `TemplateV2Detail`

---

### `GET` `/v2/documents/templates/{id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `id` | path | integer | Yes |  |

**Response 200**: `TemplateV2Detail`

---

### `PUT` `/v2/documents/templates/{id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `id` | path | integer | Yes |  |

**Request Body** (`application/json`): `TemplateV2Detail`

**Response 200**: `TemplateV2Detail`

---

### `PATCH` `/v2/documents/templates/{id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `id` | path | integer | Yes |  |

**Request Body** (`application/json`): `PatchedTemplateV2Detail`

**Response 200**: `TemplateV2Detail`

---

### `DELETE` `/v2/documents/templates/{id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `id` | path | integer | Yes |  |

**Response 204**: No response body

---

### `GET` `/v2/documents/{document_id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `document_id` | path | integer | Yes |  |

**Response 200**: `DocumentV2Detail`

---

### `PUT` `/v2/documents/{document_id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `document_id` | path | integer | Yes |  |

**Request Body** (`application/json`): `DocumentV2Detail`

**Response 200**: `DocumentV2Detail`

---

### `PATCH` `/v2/documents/{document_id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `document_id` | path | integer | Yes |  |

**Request Body** (`application/json`): `PatchedDocumentV2Detail`

**Response 200**: `DocumentV2Detail`

---

### `DELETE` `/v2/documents/{document_id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `document_id` | path | integer | Yes |  |

**Response 204**: No response body

---

### `GET` `/v2/documents/{document_id}/company/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `document_id` | path | integer | Yes |  |

**Response 200**: `DocumentSign`

---

### `POST` `/v2/documents/{document_id}/documents/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `document_id` | path | integer | Yes |  |

**Request Body** (`application/json`): `DocumentFileBase64`

**Response 201**: `DocumentFileBase64`

---

### `POST` `/v2/documents/{document_id}/documents/refresh/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `document_id` | path | integer | Yes |  |

**Response 201**: No response body

---

### `GET` `/v2/documents/{document_id}/documents/{file_id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `document_id` | path | integer | Yes |  |
| `file_id` | path | integer | Yes |  |

**Response 200**: `DocumentFileBase64`

---

### `POST` `/v2/documents/{document_id}/eds_sign/{sign_id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `document_id` | path | integer | Yes |  |
| `sign_id` | path | integer | Yes |  |

**Request Body** (`application/json`): `DocumentV2EdsSign`

**Response 201**: `DocumentV2EdsSign`

---

### `POST` `/v2/documents/{document_id}/manual_sign/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `document_id` | path | integer | Yes |  |

**Request Body** (`application/json`): `DocumentV2ManualSign`

**Response 201**: `DocumentV2ManualSign`

---

### `POST` `/v2/documents/{document_id}/signs/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `document_id` | path | integer | Yes |  |

**Request Body** (`application/json`): `DocumentV2SignUpdate`

**Response 201**: `DocumentV2SignUpdate`

---

### `PUT` `/v2/documents/{document_id}/signs/{sign_id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `document_id` | path | integer | Yes |  |
| `sign_id` | path | integer | Yes |  |

**Request Body** (`application/json`): `DocumentV2SignUpdate`

**Response 200**: `DocumentV2SignUpdate`

---

### `PATCH` `/v2/documents/{document_id}/signs/{sign_id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `document_id` | path | integer | Yes |  |
| `sign_id` | path | integer | Yes |  |

**Request Body** (`application/json`): `PatchedDocumentV2SignUpdate`

**Response 200**: `DocumentV2SignUpdate`

---

### `DELETE` `/v2/documents/{document_id}/signs/{sign_id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `document_id` | path | integer | Yes |  |
| `sign_id` | path | integer | Yes |  |

**Response 204**: No response body

---

### `POST` `/v2/documents/{document_id}/signs/{sign_id}/sms/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `document_id` | path | integer | Yes |  |
| `sign_id` | path | integer | Yes |  |

**Response 201**: No response body

---

### `GET` `/v2/documents/{document_uuid}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `document_uuid` | path | string | Yes |  |

**Response 200**: No response body

---

### `GET` `/v2/documents/{document_uuid}/documents/{file_id}/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `document_uuid` | path | string | Yes |  |
| `file_id` | path | integer | Yes |  |

**Response 200**: `DocumentFileBase64`

---

### `POST` `/v2/documents/{document_uuid}/eds/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `document_uuid` | path | string | Yes |  |

**Request Body** (`application/json`): `DocumentV2EdsSign`

**Response 201**: `DocumentV2EdsSign`

---

### `GET` `/v2/documents/{document_uuid}/egov/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `document_uuid` | path | string | Yes |  |

**Response 200**: No response body

---

### `GET` `/v2/documents/{document_uuid}/egov/confirm/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `document_uuid` | path | string | Yes |  |

**Response 200**: No response body

---

### `PUT` `/v2/documents/{document_uuid}/egov/confirm/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `document_uuid` | path | string | Yes |  |

**Response 200**: No response body

---

### `PATCH` `/v2/documents/{document_uuid}/egov/confirm/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `document_uuid` | path | string | Yes |  |

**Response 200**: No response body

---

### `POST` `/v2/documents/{document_uuid}/sign/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `document_uuid` | path | string | Yes |  |

**Request Body** (`application/json`): `DocumentClientSign`

**Response 201**: `DocumentClientSign`

---

### `POST` `/v2/documents/{document_uuid}/sign/confirm/`

**Parameters:**

| Name | In | Type | Required | Description |
|------|-----|------|----------|-------------|
| `document_uuid` | path | string | Yes |  |

**Request Body** (`application/json`): `DocumentClientSignConfirm`

**Response 201**: `DocumentClientSignConfirm`

---

## Schemas

### `ContentTypeEnum`

* `client` - client
* `orderrequest` - orderrequest

**Enum values:** `['client', 'orderrequest']`

### `DocumentClientSign`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `confirm_id` | `string` | Yes |  [readOnly] |

### `DocumentClientSignConfirm`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `confirm_id` | `string` | Yes |  |
| `code` | `string` | Yes |  |

### `DocumentFile`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | Yes |  [readOnly] |
| `file` | `string(uri)` | Yes |  |
| `type` | `Type61eEnum` | No |  |
| `extra` | `` | No |  |

### `DocumentFileBase64`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | Yes |  [readOnly] |
| `file` | `string(uri)` | Yes |  [readOnly] |
| `type` | `Type61eEnum` | No |  |
| `base64` | `string` | Yes |  [readOnly] |
| `extra` | `` | Yes |  [readOnly] |

### `DocumentSign`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | Yes |  [readOnly] |
| `uuid` | `string(uuid)` | Yes |  [readOnly] |
| `method` | `MethodEnum` | No |  |
| `method_allowed` | `array[integer]` | No |  |
| `signer` | `Signer` | Yes |  [readOnly] |
| `status` | `StatusToEnum` | No |  |
| `created_at` | `string(date-time)` | Yes |  [readOnly] |
| `updated_at` | `string(date-time)` | Yes |  [readOnly] |
| `stages` | `array[DocumentSignStage]` | Yes |  [readOnly] |

### `DocumentSignStage`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | Yes |  [readOnly] |
| `status_from` | `StatusToEnum` | Yes |  |
| `status_to` | `StatusToEnum` | Yes |  |
| `created_at` | `string(date-time)` | Yes |  [readOnly] |
| `meta` | `` | No |  |

### `DocumentV2`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | Yes |  [readOnly] |
| `uuid` | `string(uuid)` | Yes |  [readOnly] |
| `name` | `string` | No |  |
| `source` | `SourceEnum` | No |  [default=0] |
| `created_by` | `integer` | Yes |  [nullable, readOnly] |
| `template` | `integer` | No |  [nullable] |
| `type` | `TypeBe1Enum` | No |  |
| `signed` | `boolean` | Yes |  [readOnly] |
| `created_at` | `string(date-time)` | Yes |  [readOnly] |
| `updated_at` | `string(date-time)` | Yes |  [readOnly] |
| `content_type` | `string` | No |  [nullable] |
| `object_id` | `integer` | No |  [nullable] |
| `regenerate` | `boolean` | No |  [default=False] |
| `resign` | `boolean` | No |  [default=False] |
| `file` | `string(uri)` | No |  |
| `files` | `array[DocumentFile]` | Yes |  [readOnly] |
| `signs` | `array[DocumentSign]` | Yes |  [readOnly] |

### `DocumentV2Detail`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | Yes |  [readOnly] |
| `uuid` | `string(uuid)` | Yes |  [readOnly] |
| `name` | `string` | No |  |
| `source` | `SourceEnum` | No |  [default=0] |
| `created_by` | `integer` | Yes |  [nullable, readOnly] |
| `template` | `integer` | No |  [nullable] |
| `type` | `TypeBe1Enum` | No |  |
| `signed` | `boolean` | Yes |  [readOnly] |
| `created_at` | `string(date-time)` | Yes |  [readOnly] |
| `updated_at` | `string(date-time)` | Yes |  [readOnly] |
| `content_type` | `string` | No |  [nullable] |
| `object_id` | `integer` | No |  [nullable] |
| `regenerate` | `boolean` | No |  [default=False] |
| `resign` | `boolean` | No |  [default=False] |
| `file` | `string(uri)` | No |  |
| `files` | `array[DocumentFile]` | Yes |  [readOnly] |
| `signs` | `array[DocumentSign]` | Yes |  [readOnly] |
| `content` | `string` | No |  [nullable] |
| `meta` | `` | Yes |  [readOnly] |

### `DocumentV2EdsSign`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `cms` | `string` | Yes |  |

### `DocumentV2ManualSign`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `client` | `integer` | Yes |  |

### `DocumentV2SignUpdate`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | Yes |  [readOnly] |
| `client` | `integer` | Yes |  |
| `method_allowed` | `array[integer]` | No |  |
| `uuid` | `string(uuid)` | Yes |  [readOnly] |
| `method` | `MethodEnum` | Yes |  [readOnly] |
| `signer` | `Signer` | Yes |  [readOnly] |
| `status` | `StatusToEnum` | Yes |  [readOnly] |

### `FormatEnum`

* `Letter` - Letter (21,6 x 27,9 см)
* `Tabloid` - Tabloid (27,9 x 43,2 см)
* `Legal` - Legal (21,6 x 35,6 см)
* `Statement` - Statement (14,0 x 21,6 см)
* `Executive` - Executive (18,4 x 26,7 см)
* `

**Enum values:** `['Letter', 'Tabloid', 'Legal', 'Statement', 'Executive', 'Folio', 'A3', 'A4', 'A5', 'B4', 'B5', 'Custom']`

### `MethodEnum`

* `0` - manual
* `1` - sms
* `2` - egov

**Enum values:** `[0, 1, 2]`

### `PaginatedDocumentV2List`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `count` | `integer` | Yes |  |
| `next` | `string(uri)` | No |  [nullable] |
| `previous` | `string(uri)` | No |  [nullable] |
| `results` | `array[DocumentV2]` | Yes |  |

### `PatchedDocumentV2Detail`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | No |  [readOnly] |
| `uuid` | `string(uuid)` | No |  [readOnly] |
| `name` | `string` | No |  |
| `source` | `SourceEnum` | No |  [default=0] |
| `created_by` | `integer` | No |  [nullable, readOnly] |
| `template` | `integer` | No |  [nullable] |
| `type` | `TypeBe1Enum` | No |  |
| `signed` | `boolean` | No |  [readOnly] |
| `created_at` | `string(date-time)` | No |  [readOnly] |
| `updated_at` | `string(date-time)` | No |  [readOnly] |
| `content_type` | `string` | No |  [nullable] |
| `object_id` | `integer` | No |  [nullable] |
| `regenerate` | `boolean` | No |  [default=False] |
| `resign` | `boolean` | No |  [default=False] |
| `file` | `string(uri)` | No |  |
| `files` | `array[DocumentFile]` | No |  [readOnly] |
| `signs` | `array[DocumentSign]` | No |  [readOnly] |
| `content` | `string` | No |  [nullable] |
| `meta` | `` | No |  [readOnly] |

### `PatchedDocumentV2SignUpdate`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | No |  [readOnly] |
| `client` | `integer` | No |  |
| `method_allowed` | `array[integer]` | No |  |
| `uuid` | `string(uuid)` | No |  [readOnly] |
| `method` | `MethodEnum` | No |  [readOnly] |
| `signer` | `Signer` | No |  [readOnly] |
| `status` | `StatusToEnum` | No |  [readOnly] |

### `PatchedTemplateV2Detail`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | No |  [readOnly] |
| `name` | `string` | No |  [maxLen=255] |
| `content_type` | `ContentTypeEnum` | No |  |
| `filter` | `` | No |  |
| `created_by` | `integer(int64)` | No |  [nullable] |
| `points` | `array[integer]` | No |  |
| `status` | `StatusD51Enum` | No |  |
| `order` | `integer` | No |  [nullable] |
| `created_at` | `string(date-time)` | No |  [readOnly] |
| `updated_at` | `string(date-time)` | No |  [readOnly] |
| `format` | `FormatEnum` | No |  |
| `width` | `string(decimal)` | No |  |
| `height` | `string(decimal)` | No |  |
| `margin_left` | `string(decimal)` | No |  |
| `margin_right` | `string(decimal)` | No |  |
| `margin_top` | `string(decimal)` | No |  |
| `margin_bottom` | `string(decimal)` | No |  |
| `scale` | `string(decimal)` | No |  |
| `content` | `string` | No |  |

### `Signer`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | Yes |  [readOnly] |
| `name` | `string` | Yes |  [maxLen=255] |
| `phone` | `string` | No |  [nullable, maxLen=32] |
| `email` | `string(email)` | No |  [nullable, maxLen=254] |
| `type` | `SignerTypeEnum` | No |  |
| `outer_id` | `integer(int64)` | No |  [nullable] |

### `SignerTypeEnum`

* `company` - company
* `client` - клиент

**Enum values:** `['company', 'client']`

### `SourceEnum`

* `0` - generated
* `1` - uploaded

**Enum values:** `[0, 1]`

### `StatusD51Enum`

* `active` - active
* `disabled` - disabled

**Enum values:** `['active', 'disabled']`

### `StatusToEnum`

* `0` - черновик
* `1` - готово
* `2` - просмотр
* `3` - подтверждение
* `4` - отклонено
* `5` - подписано

**Enum values:** `[0, 1, 2, 3, 4, 5]`

### `TemplateV2`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | Yes |  [readOnly] |
| `name` | `string` | Yes |  [maxLen=255] |
| `content_type` | `ContentTypeEnum` | Yes |  |
| `filter` | `` | No |  |
| `created_by` | `integer(int64)` | No |  [nullable] |
| `points` | `array[integer]` | No |  |
| `status` | `StatusD51Enum` | No |  |
| `order` | `integer` | No |  [nullable] |
| `created_at` | `string(date-time)` | Yes |  [readOnly] |
| `updated_at` | `string(date-time)` | Yes |  [readOnly] |
| `format` | `FormatEnum` | No |  |
| `width` | `string(decimal)` | No |  |
| `height` | `string(decimal)` | No |  |
| `margin_left` | `string(decimal)` | No |  |
| `margin_right` | `string(decimal)` | No |  |
| `margin_top` | `string(decimal)` | No |  |
| `margin_bottom` | `string(decimal)` | No |  |
| `scale` | `string(decimal)` | No |  |

### `TemplateV2Detail`

| Field | Type | Required | Details |
|-------|------|----------|--------|
| `id` | `integer` | Yes |  [readOnly] |
| `name` | `string` | Yes |  [maxLen=255] |
| `content_type` | `ContentTypeEnum` | Yes |  |
| `filter` | `` | No |  |
| `created_by` | `integer(int64)` | No |  [nullable] |
| `points` | `array[integer]` | No |  |
| `status` | `StatusD51Enum` | No |  |
| `order` | `integer` | No |  [nullable] |
| `created_at` | `string(date-time)` | Yes |  [readOnly] |
| `updated_at` | `string(date-time)` | Yes |  [readOnly] |
| `format` | `FormatEnum` | No |  |
| `width` | `string(decimal)` | No |  |
| `height` | `string(decimal)` | No |  |
| `margin_left` | `string(decimal)` | No |  |
| `margin_right` | `string(decimal)` | No |  |
| `margin_top` | `string(decimal)` | No |  |
| `margin_bottom` | `string(decimal)` | No |  |
| `scale` | `string(decimal)` | No |  |
| `content` | `string` | Yes |  |

### `Type61eEnum`

* `0` - original
* `1` - overlay
* `2` - esign
* `3` - sign

**Enum values:** `[0, 1, 2, 3]`

### `TypeBe1Enum`

* `html` - html
* `pdf` - pdf
* `docx` - docx
* `doc` - doc

**Enum values:** `['html', 'pdf', 'docx', 'doc']`


---

