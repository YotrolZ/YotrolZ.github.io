{%- if config.cdn === 'true' and config.cdn.baseURL -%}
    <script type="text/javascript" src="{{ config.cdn.baseURL }}/js/src/even.js?v={{ theme.version }}"></script>
{%- else -%}
    <script type="text/javascript" src="{{ url_for('js/src') }}/even.js?v={{ theme.version }}"></script>
{%- endif -%}
