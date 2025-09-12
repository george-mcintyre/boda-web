# ESQUEMA DE DISEÑO - SITIO WEB DE BODA

## 🎨 PALETA DE COLORES PRINCIPAL

### Colores Base
- **Color Primario**: `#8B5A96` (Púrpura suave)
- **Color Secundario**: `#D4A5A5` (Rosa pálido)
- **Color de Acento**: `#F4E4D6` (Beige cálido)
- **Texto Oscuro**: `#2C1810` (Marrón oscuro)
- **Texto Claro**: `#6B4E3D` (Marrón claro)
- **Blanco**: `#FFFFFF`
- **Fondo Claro**: `#FDFBF7` (Beige muy claro)

### Gradientes
- **Gradiente Principal**: Púrpura → Rosa (`#8B5A96` → `#D4A5A5`)
- **Gradiente Secundario**: Beige → Blanco (`#F4E4D6` → `#FFFFFF`)
- **Gradiente de Acento**: Rosa → Beige (`#D4A5A5` → `#F4E4D6`)

## 📝 TIPOGRAFÍAS

### Fuentes Principales
- **Títulos**: 'Playfair Display' (Serif - Elegante)
- **Texto**: 'Inter' (Sans-serif - Moderna)

### Tamaños de Fuente
- **H1**: 3.5rem (Títulos principales)
- **H2**: 2.5rem (Subtítulos)
- **H3**: 1.8rem (Títulos de sección)
- **H4**: 1.3rem (Títulos menores)

## 🎯 ELEMENTOS DE DISEÑO

### Header
- **Fondo**: Gradiente púrpura-rosa
- **Padding**: 3rem 0
- **Efecto**: Textura de puntos sutiles
- **Título**: Texto blanco con sombra
- **Enlace Inicio**: Botón semitransparente con bordes redondeados

### Botones
- **Estilo**: Bordes redondeados (50px para botones principales)
- **Colores**: Gradiente púrpura-rosa
- **Efectos**: Hover con transformación y sombra
- **Padding**: 0.8rem 1.5rem

### Tarjetas y Contenedores
- **Bordes**: 20px redondeados
- **Sombras**: Sombra suave púrpura
- **Fondo**: Blanco con transparencia
- **Padding**: 2-3rem

### Formularios
- **Inputs**: Bordes redondeados (12px)
- **Focus**: Borde púrpura con sombra
- **Labels**: Color púrpura

## 🌟 EFECTOS VISUALES

### Transiciones
- **Duración**: 0.3s ease
- **Efectos**: Transform, opacity, box-shadow

### Sombras
- **Sombra Normal**: `rgba(139, 90, 150, 0.1)`
- **Sombra Hover**: `rgba(139, 90, 150, 0.2)`

### Cursor Personalizado
- **Tipo**: SVG de corazón
- **Color**: Blanco con borde negro

## 📱 RESPONSIVIDAD

### Breakpoints
- **Móvil**: max-width: 768px
- **Tablet**: max-width: 1024px
- **Desktop**: min-width: 1025px

### Adaptaciones
- **Fuentes**: Reducción proporcional
- **Padding**: Reducción en móviles
- **Layout**: Flexbox y Grid adaptativo

## 🎨 ESTILOS ESPECÍFICOS

### Secciones Principales
1. **Hero Section**: Gradiente de fondo, texto centrado
2. **Formularios**: Tarjetas blancas con sombras
3. **Listas**: Bordes izquierdos púrpura
4. **Modales**: Fondo semitransparente, tarjetas centradas

### Estados Interactivos
- **Hover**: Transformación Y(-2px), sombra aumentada
- **Focus**: Bordes púrpura, sombra
- **Active**: Escala ligeramente reducida

## 🔧 VARIABLES CSS DISPONIBLES

```css
:root {
  --primary-color: #8B5A96;
  --secondary-color: #D4A5A5;
  --accent-color: #F4E4D6;
  --text-dark: #2C1810;
  --text-light: #6B4E3D;
  --white: #FFFFFF;
  --light-bg: #FDFBF7;
  --gradient-primary: linear-gradient(135deg, #8B5A96 0%, #D4A5A5 100%);
  --gradient-secondary: linear-gradient(135deg, #F4E4D6 0%, #FFFFFF 100%);
  --gradient-accent: linear-gradient(135deg, #D4A5A5 0%, #F4E4D6 100%);
}
```

## 📋 CARACTERÍSTICAS MODIFICABLES

### 🎨 **COLORES** (Cambio Rápido)
- [ ] Color primario (actual: púrpura)
- [ ] Color secundario (actual: rosa)
- [ ] Color de acento (actual: beige)
- [ ] Colores de texto
- [ ] Gradientes

### 📝 **TIPOGRAFÍAS** (Cambio Rápido)
- [ ] Fuente de títulos (actual: Playfair Display)
- [ ] Fuente de texto (actual: Inter)
- [ ] Tamaños de fuente
- [ ] Pesos de fuente

### 🎯 **ESTILOS** (Cambio Rápido)
- [ ] Bordes redondeados (actual: 20px)
- [ ] Sombras (actual: suaves)
- [ ] Efectos hover
- [ ] Transiciones

### 🌟 **EFECTOS** (Cambio Rápido)
- [ ] Cursor personalizado
- [ ] Animaciones
- [ ] Texturas de fondo
- [ ] Efectos de glassmorphism

### 📱 **LAYOUT** (Cambio Moderado)
- [ ] Espaciado general
- [ ] Tamaños de contenedores
- [ ] Disposición de elementos
- [ ] Responsividad

---

## 💡 RECOMENDACIONES PARA CAMBIOS

### Cambios Rápidos (Solo variables CSS)
- Colores de la paleta
- Tipografías
- Bordes redondeados
- Sombras

### Cambios Moderados (Modificar estilos específicos)
- Layout de secciones
- Tamaños de elementos
- Espaciado general

### Cambios Complejos (Rediseño parcial)
- Estructura completa
- Nuevos componentes
- Animaciones complejas

---

**Nota**: Los cambios en las variables CSS (`:root`) se aplican automáticamente a todo el sitio. Los cambios específicos requieren modificar las reglas CSS correspondientes.
