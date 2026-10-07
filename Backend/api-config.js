(function configureRivoshoppaApi() {
  const protocol = window.location.protocol;
  const origin = /^https?:$/.test(protocol) ? window.location.origin : "";
  const staticServerPorts = new Set(["3000", "3001", "4173", "5000", "5500", "5501", "8000", "8080", "8081"]);
  const isStaticServer = staticServerPorts.has(window.location.port);

  window.RivoshoppaApiBase = origin && !isStaticServer
    ? origin
    : "http://localhost:4000";
})();