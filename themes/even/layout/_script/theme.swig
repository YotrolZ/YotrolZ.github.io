{%- if config.cdn and config.cdn.jsdelivr and config.cdn.jsdelivr.enable and config.cdn.jsdelivr.baseURL -%}
    <script type="text/javascript" src="{{ config.cdn.jsdelivr.baseURL }}/js/src/even.js?v={{ theme.version }}"></script>
{%- else -%}
    <script type="text/javascript" src="{{ url_for('js/src') }}/even.js?v={{ theme.version }}"></script>
{%- endif -%}
