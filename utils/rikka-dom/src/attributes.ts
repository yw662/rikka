import type { Signal } from "@rikka/signal";

export type AttrValue =
  | string
  | number
  | boolean
  | Signal.State<string>
  | Signal.Computed<string>;

export type StyleValue =
  | string
  | number
  | Signal.State<string | number>
  | Signal.Computed<string | number>;

export type StyleRecord = Record<string, StyleValue>;

export type StyleAttr =
  | AttrValue
  | StyleRecord
  | CSSStyleSheet
  | Signal.State<string | StyleRecord>
  | Signal.Computed<string | StyleRecord>;

export interface GlobalHTMLAttributes {
  id?: AttrValue;
  title?: AttrValue;
  lang?: AttrValue;
  dir?: AttrValue;
  tabindex?: AttrValue;
  role?: AttrValue;
  hidden?: AttrValue;
  draggable?: AttrValue;
  contenteditable?: AttrValue;
  spellcheck?: AttrValue;
  autofocus?: AttrValue;
  translate?: AttrValue;
  accesskey?: AttrValue;
  autocapitalize?: AttrValue;
  inert?: AttrValue;
  inputmode?: AttrValue;
  enterkeyhint?: AttrValue;
  part?: AttrValue;
  slot?: AttrValue;
  nonce?: AttrValue;
  style?: StyleAttr;
  class?: AttrValue;
  className?: AttrValue;
  dataset?: Record<string, AttrValue>;
}

export interface AriaAttributes {
  [key: `aria-${string}`]: AttrValue | undefined;
}

export interface DataAttributes {
  [key: `data-${string}`]: AttrValue | undefined;
}

export type CommonHTMLAttributes = GlobalHTMLAttributes &
  AriaAttributes &
  DataAttributes;

export interface AnchorHTMLAttributes extends CommonHTMLAttributes {
  href?: AttrValue;
  target?: AttrValue;
  rel?: AttrValue;
  download?: AttrValue;
  hreflang?: AttrValue;
  type?: AttrValue;
  referrerpolicy?: AttrValue;
  ping?: AttrValue;
}

export interface AreaHTMLAttributes extends CommonHTMLAttributes {
  alt?: AttrValue;
  coords?: AttrValue;
  shape?: AttrValue;
  href?: AttrValue;
  target?: AttrValue;
  rel?: AttrValue;
  download?: AttrValue;
  hreflang?: AttrValue;
  type?: AttrValue;
  referrerpolicy?: AttrValue;
}

export interface AudioHTMLAttributes extends MediaHTMLAttributes {}

export interface BaseHTMLAttributes extends CommonHTMLAttributes {
  href?: AttrValue;
  target?: AttrValue;
}

export interface BlockquoteHTMLAttributes extends CommonHTMLAttributes {
  cite?: AttrValue;
}

export interface ButtonHTMLAttributes extends CommonHTMLAttributes {
  type?: AttrValue;
  disabled?: AttrValue;
  name?: AttrValue;
  value?: AttrValue;
  form?: AttrValue;
  formaction?: AttrValue;
  formenctype?: AttrValue;
  formmethod?: AttrValue;
  formnovalidate?: AttrValue;
  formtarget?: AttrValue;
}

export interface CanvasHTMLAttributes extends CommonHTMLAttributes {
  width?: AttrValue;
  height?: AttrValue;
}

export interface ColHTMLAttributes extends CommonHTMLAttributes {
  span?: AttrValue;
}

export interface ColgroupHTMLAttributes extends CommonHTMLAttributes {
  span?: AttrValue;
}

export interface DataHTMLAttributes extends CommonHTMLAttributes {
  value?: AttrValue;
}

export interface DetailsHTMLAttributes extends CommonHTMLAttributes {
  open?: AttrValue;
  name?: AttrValue;
}

export interface DialogHTMLAttributes extends CommonHTMLAttributes {
  open?: AttrValue;
}

export interface EmbedHTMLAttributes extends CommonHTMLAttributes {
  src?: AttrValue;
  type?: AttrValue;
  width?: AttrValue;
  height?: AttrValue;
}

export interface FieldsetHTMLAttributes extends CommonHTMLAttributes {
  disabled?: AttrValue;
  form?: AttrValue;
  name?: AttrValue;
}

export interface FormHTMLAttributes extends CommonHTMLAttributes {
  action?: AttrValue;
  method?: AttrValue;
  enctype?: AttrValue;
  acceptCharset?: AttrValue;
  target?: AttrValue;
  autocomplete?: AttrValue;
  name?: AttrValue;
  novalidate?: AttrValue;
  rel?: AttrValue;
}

export interface HrHTMLAttributes extends CommonHTMLAttributes {}

export interface IframeHTMLAttributes extends CommonHTMLAttributes {
  src?: AttrValue;
  srcdoc?: AttrValue;
  name?: AttrValue;
  sandbox?: AttrValue;
  allow?: AttrValue;
  allowfullscreen?: AttrValue;
  allowpaymentrequest?: AttrValue;
  width?: AttrValue;
  height?: AttrValue;
  referrerpolicy?: AttrValue;
  loading?: AttrValue;
}

export interface ImgHTMLAttributes extends CommonHTMLAttributes {
  src?: AttrValue;
  alt?: AttrValue;
  width?: AttrValue;
  height?: AttrValue;
  loading?: AttrValue;
  decoding?: AttrValue;
  srcset?: AttrValue;
  sizes?: AttrValue;
  crossorigin?: AttrValue;
  usemap?: AttrValue;
  ismap?: AttrValue;
  referrerpolicy?: AttrValue;
  fetchpriority?: AttrValue;
}

export interface InputHTMLAttributes extends CommonHTMLAttributes {
  type?: AttrValue;
  value?: AttrValue;
  checked?: AttrValue;
  placeholder?: AttrValue;
  disabled?: AttrValue;
  readonly?: AttrValue;
  required?: AttrValue;
  name?: AttrValue;
  min?: AttrValue;
  max?: AttrValue;
  step?: AttrValue;
  maxlength?: AttrValue;
  minlength?: AttrValue;
  pattern?: AttrValue;
  multiple?: AttrValue;
  accept?: AttrValue;
  autocomplete?: AttrValue;
  form?: AttrValue;
  formaction?: AttrValue;
  formenctype?: AttrValue;
  formmethod?: AttrValue;
  formnovalidate?: AttrValue;
  formtarget?: AttrValue;
  list?: AttrValue;
  size?: AttrValue;
  src?: AttrValue;
  width?: AttrValue;
  height?: AttrValue;
  alt?: AttrValue;
  dirname?: AttrValue;
}

export interface LabelHTMLAttributes extends CommonHTMLAttributes {
  for?: AttrValue;
  form?: AttrValue;
}

export interface LiHTMLAttributes extends CommonHTMLAttributes {
  value?: AttrValue;
}

export interface LinkHTMLAttributes extends CommonHTMLAttributes {
  href?: AttrValue;
  rel?: AttrValue;
  type?: AttrValue;
  as?: AttrValue;
  crossorigin?: AttrValue;
  integrity?: AttrValue;
  media?: AttrValue;
  sizes?: AttrValue;
  prefetch?: AttrValue;
  referrerpolicy?: AttrValue;
  fetchpriority?: AttrValue;
  imagesrcset?: AttrValue;
  imagesizes?: AttrValue;
  disabled?: AttrValue;
  blocking?: AttrValue;
}

export interface MapHTMLAttributes extends CommonHTMLAttributes {
  name?: AttrValue;
}

export interface MediaHTMLAttributes extends CommonHTMLAttributes {
  src?: AttrValue;
  crossorigin?: AttrValue;
  autoplay?: AttrValue;
  controls?: AttrValue;
  loop?: AttrValue;
  muted?: AttrValue;
  preload?: AttrValue;
}

export interface MenuHTMLAttributes extends CommonHTMLAttributes {
  type?: AttrValue;
  label?: AttrValue;
}

export interface MetaHTMLAttributes extends CommonHTMLAttributes {
  name?: AttrValue;
  content?: AttrValue;
  charset?: AttrValue;
  httpEquiv?: AttrValue;
  property?: AttrValue;
}

export interface MeterHTMLAttributes extends CommonHTMLAttributes {
  min?: AttrValue;
  max?: AttrValue;
  value?: AttrValue;
  low?: AttrValue;
  high?: AttrValue;
  optimum?: AttrValue;
  form?: AttrValue;
}

export interface ObjectHTMLAttributes extends CommonHTMLAttributes {
  data?: AttrValue;
  type?: AttrValue;
  name?: AttrValue;
  form?: AttrValue;
  width?: AttrValue;
  height?: AttrValue;
  typemustmatch?: AttrValue;
}

export interface OlHTMLAttributes extends CommonHTMLAttributes {
  type?: AttrValue;
  start?: AttrValue;
  reversed?: AttrValue;
}

export interface OptgroupHTMLAttributes extends CommonHTMLAttributes {
  disabled?: AttrValue;
  label?: AttrValue;
}

export interface OptionHTMLAttributes extends CommonHTMLAttributes {
  disabled?: AttrValue;
  label?: AttrValue;
  selected?: AttrValue;
  value?: AttrValue;
}

export interface OutputHTMLAttributes extends CommonHTMLAttributes {
  for?: AttrValue;
  form?: AttrValue;
  name?: AttrValue;
}

export interface ProgressHTMLAttributes extends CommonHTMLAttributes {
  max?: AttrValue;
  value?: AttrValue;
}

export interface QuoteHTMLAttributes extends CommonHTMLAttributes {
  cite?: AttrValue;
}

export interface ScriptHTMLAttributes extends CommonHTMLAttributes {
  src?: AttrValue;
  type?: AttrValue;
  async?: AttrValue;
  defer?: AttrValue;
  crossorigin?: AttrValue;
  integrity?: AttrValue;
  nomodule?: AttrValue;
  nonce?: AttrValue;
  referrerpolicy?: AttrValue;
  blocking?: AttrValue;
  fetchpriority?: AttrValue;
}

export interface SelectHTMLAttributes extends CommonHTMLAttributes {
  disabled?: AttrValue;
  multiple?: AttrValue;
  name?: AttrValue;
  required?: AttrValue;
  size?: AttrValue;
  form?: AttrValue;
  autocomplete?: AttrValue;
  selectedIndex?: AttrValue;
}

export interface SourceHTMLAttributes extends CommonHTMLAttributes {
  src?: AttrValue;
  type?: AttrValue;
  srcset?: AttrValue;
  sizes?: AttrValue;
  media?: AttrValue;
  width?: AttrValue;
  height?: AttrValue;
}

export interface StyleHTMLAttributes extends CommonHTMLAttributes {
  media?: AttrValue;
  nonce?: AttrValue;
  blocking?: AttrValue;
}

export interface TableHTMLAttributes extends CommonHTMLAttributes {}

export interface TdHTMLAttributes extends CommonHTMLAttributes {
  colspan?: AttrValue;
  rowspan?: AttrValue;
  headers?: AttrValue;
}

export interface TextareaHTMLAttributes extends CommonHTMLAttributes {
  disabled?: AttrValue;
  name?: AttrValue;
  placeholder?: AttrValue;
  readonly?: AttrValue;
  required?: AttrValue;
  rows?: AttrValue;
  cols?: AttrValue;
  wrap?: AttrValue;
  maxlength?: AttrValue;
  minlength?: AttrValue;
  form?: AttrValue;
  autocomplete?: AttrValue;
  dirname?: AttrValue;
  defaultValue?: string;
}

export interface ThHTMLAttributes extends CommonHTMLAttributes {
  colspan?: AttrValue;
  rowspan?: AttrValue;
  headers?: AttrValue;
  scope?: AttrValue;
  abbr?: AttrValue;
}

export interface TimeHTMLAttributes extends CommonHTMLAttributes {
  datetime?: AttrValue;
}

export interface TrackHTMLAttributes extends CommonHTMLAttributes {
  src?: AttrValue;
  kind?: AttrValue;
  srclang?: AttrValue;
  label?: AttrValue;
  default?: AttrValue;
}

export interface VideoHTMLAttributes extends MediaHTMLAttributes {
  poster?: AttrValue;
  width?: AttrValue;
  height?: AttrValue;
  playsinline?: AttrValue;
  disablepictureinpicture?: AttrValue;
  disableremoteplayback?: AttrValue;
}

export interface SVGAttributes extends AriaAttributes, DataAttributes {
  id?: AttrValue;
  class?: AttrValue;
  className?: AttrValue;
  style?: StyleAttr;
  tabindex?: AttrValue;
  role?: AttrValue;
  xmlns?: AttrValue;
  version?: AttrValue;
  width?: AttrValue;
  height?: AttrValue;
  x?: AttrValue;
  y?: AttrValue;
  cx?: AttrValue;
  cy?: AttrValue;
  r?: AttrValue;
  rx?: AttrValue;
  ry?: AttrValue;
  d?: AttrValue;
  fill?: AttrValue;
  stroke?: AttrValue;
  strokeWidth?: AttrValue;
  strokeLinecap?: AttrValue;
  strokeLinejoin?: AttrValue;
  strokeDasharray?: AttrValue;
  strokeDashoffset?: AttrValue;
  strokeMiterlimit?: AttrValue;
  strokeOpacity?: AttrValue;
  fillOpacity?: AttrValue;
  fillRule?: AttrValue;
  clipRule?: AttrValue;
  clipPath?: AttrValue;
  mask?: AttrValue;
  transform?: AttrValue;
  viewBox?: AttrValue;
  preserveAspectRatio?: AttrValue;
  opacity?: AttrValue;
  points?: AttrValue;
  offset?: AttrValue;
  stopColor?: AttrValue;
  stopOpacity?: AttrValue;
  fontSize?: AttrValue;
  fontFamily?: AttrValue;
  fontWeight?: AttrValue;
  fontStyle?: AttrValue;
  textDecoration?: AttrValue;
  textAnchor?: AttrValue;
  dominantBaseline?: AttrValue;
  dx?: AttrValue;
  dy?: AttrValue;
  rotate?: AttrValue;
  textLength?: AttrValue;
  lengthAdjust?: AttrValue;
  patternUnits?: AttrValue;
  patternTransform?: AttrValue;
  gradientUnits?: AttrValue;
  gradientTransform?: AttrValue;
  spreadMethod?: AttrValue;
  filterUnits?: AttrValue;
  stdDeviation?: AttrValue;
  in?: AttrValue;
  in2?: AttrValue;
  result?: AttrValue;
  mode?: AttrValue;
  href?: AttrValue;
  target?: AttrValue;
  markerWidth?: AttrValue;
  markerHeight?: AttrValue;
  refX?: AttrValue;
  refY?: AttrValue;
  orient?: AttrValue;
  markerUnits?: AttrValue;
  color?: AttrValue;
  colorInterpolation?: AttrValue;
  colorInterpolationFilters?: AttrValue;
  display?: AttrValue;
  visibility?: AttrValue;
  overflow?: AttrValue;
  cursor?: AttrValue;
  pointerEvents?: AttrValue;
  filter?: AttrValue;
  foreignObject?: AttrValue;
  requiredFeatures?: AttrValue;
  requiredExtensions?: AttrValue;
  systemLanguage?: AttrValue;
  baseProfile?: AttrValue;
  contentScriptType?: AttrValue;
  contentStyleType?: AttrValue;
  zoomAndPan?: AttrValue;
  xmlSpace?: AttrValue;
  xmlLang?: AttrValue;
}

export interface MathMLAttributes extends AriaAttributes, DataAttributes {
  id?: AttrValue;
  class?: AttrValue;
  className?: AttrValue;
  style?: StyleAttr;
  tabindex?: AttrValue;
  role?: AttrValue;
  displaystyle?: AttrValue;
  mathvariant?: AttrValue;
  mathsize?: AttrValue;
  scriptlevel?: AttrValue;
  dir?: AttrValue;
  href?: AttrValue;
  mathbackground?: AttrValue;
  mathcolor?: AttrValue;
}

export type AttrTagNameMap = {
  a: AnchorHTMLAttributes;
  abbr: CommonHTMLAttributes;
  address: CommonHTMLAttributes;
  area: AreaHTMLAttributes;
  article: CommonHTMLAttributes;
  aside: CommonHTMLAttributes;
  audio: AudioHTMLAttributes;
  b: CommonHTMLAttributes;
  base: BaseHTMLAttributes;
  bdi: CommonHTMLAttributes;
  bdo: CommonHTMLAttributes;
  blockquote: BlockquoteHTMLAttributes;
  body: CommonHTMLAttributes;
  br: CommonHTMLAttributes;
  button: ButtonHTMLAttributes;
  canvas: CanvasHTMLAttributes;
  caption: CommonHTMLAttributes;
  cite: CommonHTMLAttributes;
  code: CommonHTMLAttributes;
  col: ColHTMLAttributes;
  colgroup: ColgroupHTMLAttributes;
  data: DataHTMLAttributes;
  datalist: CommonHTMLAttributes;
  dd: CommonHTMLAttributes;
  del: QuoteHTMLAttributes;
  details: DetailsHTMLAttributes;
  dfn: CommonHTMLAttributes;
  dialog: DialogHTMLAttributes;
  div: CommonHTMLAttributes;
  dl: CommonHTMLAttributes;
  dt: CommonHTMLAttributes;
  em: CommonHTMLAttributes;
  embed: EmbedHTMLAttributes;
  fieldset: FieldsetHTMLAttributes;
  figcaption: CommonHTMLAttributes;
  figure: CommonHTMLAttributes;
  footer: CommonHTMLAttributes;
  form: FormHTMLAttributes;
  h1: CommonHTMLAttributes;
  h2: CommonHTMLAttributes;
  h3: CommonHTMLAttributes;
  h4: CommonHTMLAttributes;
  h5: CommonHTMLAttributes;
  h6: CommonHTMLAttributes;
  head: CommonHTMLAttributes;
  header: CommonHTMLAttributes;
  hgroup: CommonHTMLAttributes;
  hr: HrHTMLAttributes;
  html: CommonHTMLAttributes;
  i: CommonHTMLAttributes;
  iframe: IframeHTMLAttributes;
  img: ImgHTMLAttributes;
  input: InputHTMLAttributes;
  ins: QuoteHTMLAttributes;
  kbd: CommonHTMLAttributes;
  label: LabelHTMLAttributes;
  legend: CommonHTMLAttributes;
  li: LiHTMLAttributes;
  link: LinkHTMLAttributes;
  main: CommonHTMLAttributes;
  map: MapHTMLAttributes;
  mark: CommonHTMLAttributes;
  menu: MenuHTMLAttributes;
  meta: MetaHTMLAttributes;
  meter: MeterHTMLAttributes;
  nav: CommonHTMLAttributes;
  noscript: CommonHTMLAttributes;
  object: ObjectHTMLAttributes;
  ol: OlHTMLAttributes;
  optgroup: OptgroupHTMLAttributes;
  option: OptionHTMLAttributes;
  output: OutputHTMLAttributes;
  p: CommonHTMLAttributes;
  picture: CommonHTMLAttributes;
  pre: CommonHTMLAttributes;
  progress: ProgressHTMLAttributes;
  q: QuoteHTMLAttributes;
  rp: CommonHTMLAttributes;
  rt: CommonHTMLAttributes;
  ruby: CommonHTMLAttributes;
  s: CommonHTMLAttributes;
  samp: CommonHTMLAttributes;
  script: ScriptHTMLAttributes;
  search: CommonHTMLAttributes;
  section: CommonHTMLAttributes;
  select: SelectHTMLAttributes;
  slot: CommonHTMLAttributes;
  small: CommonHTMLAttributes;
  source: SourceHTMLAttributes;
  span: CommonHTMLAttributes;
  strong: CommonHTMLAttributes;
  style: StyleHTMLAttributes;
  sub: CommonHTMLAttributes;
  summary: CommonHTMLAttributes;
  sup: CommonHTMLAttributes;
  table: TableHTMLAttributes;
  tbody: CommonHTMLAttributes;
  td: TdHTMLAttributes;
  template: CommonHTMLAttributes;
  textarea: TextareaHTMLAttributes;
  tfoot: CommonHTMLAttributes;
  th: ThHTMLAttributes;
  thead: CommonHTMLAttributes;
  time: TimeHTMLAttributes;
  title: CommonHTMLAttributes;
  tr: CommonHTMLAttributes;
  track: TrackHTMLAttributes;
  u: CommonHTMLAttributes;
  ul: CommonHTMLAttributes;
  var: CommonHTMLAttributes;
  video: VideoHTMLAttributes;
  wbr: CommonHTMLAttributes;
} & {
  [K in keyof SVGElementTagNameMap as K extends keyof HTMLElementTagNameMap
    ? never
    : K]: SVGAttributes;
} & {
  [K in keyof MathMLElementTagNameMap as K extends
    | keyof HTMLElementTagNameMap
    | keyof SVGElementTagNameMap
    ? never
    : K]: MathMLAttributes;
};
