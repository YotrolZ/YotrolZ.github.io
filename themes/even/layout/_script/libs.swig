{%- if theme.fancybox -%}
  {%- set fancybox_js = 'fancybox/jquery.fancybox.pack.js' -%}
{%- endif -%}

{%-
  set js_libs = {
    jquery: 'jquery/jquery.min.js',
    slideout: 'slideout/slideout.js',
    fancybox: fancybox_js,
    nprogress: nprogress_js,
  }
-%}

{%- for lib in js_libs -%}
  {%- if lib -%}
    {%- if config.cdn and config.cdn.jsdelivr and config.cdn.jsdelivr.enable and config.cdn.jsdelivr.baseURL -%}
      <script type="text/javascript" src="{{ config.cdn.jsdelivr.baseURL }}/lib/{{ lib }}"></script>
    {%- else -%}
      <script type="text/javascript" src="{{ url_for('lib') }}/{{ lib }}"></script>
    {%- endif -%}
  {%- endif -%}
{%- endfor -%}
