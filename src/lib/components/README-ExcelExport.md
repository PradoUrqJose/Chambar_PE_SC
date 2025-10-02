# Componentes de Exportación a Excel

Este directorio contiene componentes reutilizables para exportar datos a Excel de manera fácil y personalizable.

## Componentes Disponibles

### 1. ExcelExporter.svelte

Componente principal para exportar una sola tabla a Excel.

#### Uso Básico

```svelte
<script>
  import { ExcelExporter } from '$lib/components';
  
  let data = [
    { name: 'Juan', age: 30, email: 'juan@example.com' },
    { name: 'María', age: 25, email: 'maria@example.com' }
  ];
  
  let columns = [
    { key: 'name', label: 'Nombre', type: 'text' },
    { key: 'age', label: 'Edad', type: 'text' },
    { key: 'email', label: 'Email', type: 'email' }
  ];
</script>

<!-- Modo normal con texto -->
<ExcelExporter {data} {columns} />

<!-- Modo solo icono -->
<ExcelExporter {data} {columns} iconOnly={true} />
```

#### Props

| Prop | Tipo | Requerido | Descripción |
|------|------|-----------|-------------|
| `data` | `any[]` | ✅ | Array de objetos con los datos a exportar |
| `columns` | `Column[]` | ✅ | Configuración de las columnas |
| `exportOptions` | `ExportOptions` | ❌ | Opciones de exportación personalizadas |
| `buttonText` | `string` | ❌ | Texto del botón (default: "Exportar a Excel") |
| `buttonClass` | `string` | ❌ | Clases CSS del botón |
| `showIcon` | `boolean` | ❌ | Mostrar icono en el botón (default: true) |
| `disabled` | `boolean` | ❌ | Deshabilitar el botón (default: false) |
| `onExportStart` | `function` | ❌ | Callback al iniciar exportación |
| `onExportComplete` | `function` | ❌ | Callback al completar exportación |
| `onExportError` | `function` | ❌ | Callback en caso de error |

#### Configuración de Columnas

```typescript
interface Column {
  key: string;                    // Clave del campo en los datos
  label: string;                  // Etiqueta a mostrar en Excel
  type?: 'text' | 'badge' | 'email' | 'phone' | 'date' | 'custom';
  badgeConfig?: {                 // Configuración para badges
    values: Record<string, { text: string; class: string }>;
  };
  formatter?: (value: any, item: any) => string; // Formateador personalizado
  width?: string;                 // Ancho de columna
}
```

### 2. ExcelMultiSheetExporter.svelte

Componente para exportar múltiples hojas de Excel con diferentes conjuntos de datos.

#### Uso Básico

```svelte
<script>
  import { ExcelMultiSheetExporter } from '$lib/components';
  
  let sheets = [
    {
      name: 'Operaciones',
      data: operationsData,
      columns: operationsColumns
    },
    {
      name: 'Empresas',
      data: companiesData,
      columns: companiesColumns
    }
  ];
</script>

<ExcelMultiSheetExporter {sheets} filename="reporte_completo" />
```

#### Props

| Prop | Tipo | Requerido | Descripción |
|------|------|-----------|-------------|
| `sheets` | `SheetData[]` | ✅ | Array de hojas con sus datos y columnas |
| `filename` | `string` | ❌ | Nombre del archivo (default: "reporte_completo") |
| `buttonText` | `string` | ❌ | Texto del botón (default: "Exportar Reporte Completo") |
| `buttonClass` | `string` | ❌ | Clases CSS del botón |
| `showIcon` | `boolean` | ❌ | Mostrar icono en el botón (default: true) |
| `disabled` | `boolean` | ❌ | Deshabilitar el botón (default: false) |
| `onExportStart` | `function` | ❌ | Callback al iniciar exportación |
| `onExportComplete` | `function` | ❌ | Callback al completar exportación |
| `onExportError` | `function` | ❌ | Callback en caso de error |

## Utilidades

### excel-export.ts

Archivo de utilidades que contiene funciones helper y configuraciones predefinidas.

#### Funciones Principales

- `exportToExcel(data, columns, options)`: Exporta datos a Excel
- `exportMultipleSheets(sheets, filename)`: Exporta múltiples hojas
- `exportTableToExcel(tableElement, filename)`: Exporta tabla HTML directamente

#### Configuraciones Predefinidas

- `getCatalogExportOptions(catalogName)`: Para catálogos
- `getOperationsExportOptions()`: Para operaciones
- `getReportExportOptions(reportName)`: Para reportes

#### Ejemplo de Uso de Utilidades

```typescript
import { exportToExcel, getCatalogExportOptions } from '$lib/utils/excel-export';

// Exportar con configuración predefinida
const options = getCatalogExportOptions('empresas');
await exportToExcel(data, columns, options);

// Exportar con configuración personalizada
await exportToExcel(data, columns, {
  filename: 'mi_archivo',
  sheetName: 'Mi Hoja',
  includeHeaders: true,
  customStyles: {
    headerStyle: {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "4CAF50" } }
    }
  }
});
```

## Ejemplos de Integración

### En una Página de Catálogos

```svelte
<script>
  import { ExcelExporter } from '$lib/components';
  import { getCatalogExportOptions } from '$lib/utils/excel-export';
  
  let filteredData = $state([]);
  let columns = $state([]);
  let activeTab = $state('empresas');
</script>

<ExcelExporter
  data={filteredData}
  columns={columns}
  exportOptions={getCatalogExportOptions(activeTab)}
  buttonText="Exportar a Excel"
  onExportComplete={(filename) => showSuccessMessage(`Archivo ${filename} exportado correctamente`)}
  onExportError={(error) => errorMessage = `Error al exportar: ${error.message}`}
/>
```

### En una Página de Reportes

```svelte
<script>
  import { ExcelMultiSheetExporter } from '$lib/components';
  import { getReportExportOptions } from '$lib/utils/excel-export';
  
  let sheets = $state([]);
</script>

<ExcelMultiSheetExporter
  {sheets}
  filename="reporte_completo"
  buttonText="Exportar Reporte Completo"
  onExportComplete={(filename) => successMessage = `Reporte ${filename} exportado correctamente`}
/>
```

## Características

- ✅ **Ligero**: Usa la librería `xlsx` (SheetJS) que es muy eficiente
- ✅ **Personalizable**: Múltiples opciones de configuración
- ✅ **Reutilizable**: Componentes que se pueden usar en cualquier parte
- ✅ **Optimizable**: Manejo eficiente de memoria para grandes datasets
- ✅ **TypeScript**: Completamente tipado
- ✅ **Responsive**: Botones que se adaptan al diseño
- ✅ **Accesible**: Soporte para lectores de pantalla
- ✅ **Estilos**: Configuración de estilos para encabezados y datos

## Dependencias

- `xlsx`: Librería principal para manipulación de archivos Excel
- `svelte`: Framework base

## Instalación

```bash
npm install xlsx
```

Los componentes ya están configurados y listos para usar en el proyecto.

## 🎨 Mejoras de Diseño Excel

### Estilos Aplicados Automáticamente

Los archivos Excel exportados incluyen estilos profesionales:

- **Encabezados**: Fondo azul (#4472C4), texto blanco, negrita, centrado
- **Bordes**: Líneas negras en encabezados, grises en datos
- **Filas alternadas**: Fondo blanco y gris claro (#F8F9FA) para mejor legibilidad
- **Alineación**: Centrado vertical en todas las celdas
- **Ancho de columnas**: Ajustado automáticamente según el contenido

## 🎨 Iconos Personalizados

### Iconos PNG Incluidos

El proyecto incluye iconos PNG optimizados para los botones de exportación:

- **`/excel-icon.png`**: Icono para exportación simple (una sola hoja)
- **`/excel-icon-multi.png`**: Icono para exportación múltiple (varias hojas)

### Uso de Iconos Personalizados

```svelte
<!-- Con icono personalizado -->
<ExcelExporter
  {data}
  {columns}
  iconOnly={true}
  iconPath="/mi-icono-personalizado.png"
/>

<!-- Con icono múltiple personalizado -->
<ExcelMultiSheetExporter
  {sheets}
  iconOnly={true}
  iconPath="/mi-icono-multi-personalizado.png"
/>
```

### Estilos de Iconos

Los iconos PNG incluyen:
- **Tamaño optimizado**: 24x24px para mejor calidad
- **Efectos hover**: Escala ligeramente al pasar el mouse
- **Efectos active**: Se reduce al hacer clic
- **Sombra sutil**: `drop-shadow-sm` para mejor contraste
- **Transiciones suaves**: Animaciones de 0.2s

### Personalización de Iconos

Para usar tus propios iconos:

1. Coloca el archivo PNG en la carpeta `/static/`
2. Especifica la ruta en el prop `iconPath`
3. Asegúrate de que el icono tenga un tamaño de 24x24px para mejor calidad
4. Los iconos se escalarán automáticamente a 24x24px (w-6 h-6)

## 📊 Multi-Export en Catálogos

### Funcionalidad Especial

La página de catálogos incluye un botón adicional para exportar todos los catálogos en un solo archivo Excel:

- **Icono simple**: Exporta solo el catálogo activo
- **Icono múltiple**: Exporta todos los catálogos en diferentes hojas

### Hojas Incluidas en Multi-Export

1. **Empresas**: Lista completa de empresas
2. **Stands**: Lista completa de stands
3. **Responsables**: Lista completa de responsables
4. **Detalles de Operación**: Lista completa de detalles

### Uso

```svelte
<!-- En la página de catálogos -->
<ExcelMultiSheetExporter
  sheets={getAllCatalogsForExport()}
  filename="catalogos_completo"
  iconOnly={true}
  iconPath="/excel-icon-multi.png"
  onExportComplete={(filename) => showSuccessMessage(`Reporte completo ${filename} exportado correctamente`)}
  onExportError={(error) => errorMessage = `Error al exportar reporte: ${error.message}`}
/>
```

