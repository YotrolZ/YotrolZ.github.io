{%- if theme.leancloud.app_id and theme.leancloud.app_key -%}
  <script src="//cdn.jsdelivr.net/npm/leancloud-storage@4.10.0/dist/av-min.js"></script>
  <script id="leancloud">
    AV.init({
      appId: "{{ theme.leancloud.app_id }}",
      appKey: "{{ theme.leancloud.app_key }}"
    });
  </script>
{%- endif -%}

