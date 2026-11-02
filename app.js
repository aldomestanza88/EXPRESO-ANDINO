/**
 * EXPRESO ANDINO - LÓGICA DE NEGOCIO Y GESTIÓN DE HORARIOS
 */

// ESTADO INICIAL / DATOS PRECARGADOS
const defaultRoutes = [
    { id: 'R1', origin: 'Lima (Javier Prado)', destination: 'Huaraz', durationHours: 8, basePrice: 65 },
    { id: 'R2', origin: 'Lima (Plaza Norte)', destination: 'Huancayo', durationHours: 7, basePrice: 55 },
    { id: 'R3', origin: 'Lima (Javier Prado)', destination: 'Cusco (Imperial)', durationHours: 21, basePrice: 120 }
  ];
  
  const defaultBuses = [
    { id: 'B1', plate: 'AND-501', model: 'Scania Marcopolo G7', serviceType: 'Crucero VIP', capacity: 40 },
    { id: 'B2', plate: 'AND-702', model: 'Volvo B430R', serviceType: 'Doble Piso Mixto', capacity: 48 },
    { id: 'B3', plate: 'AND-890', model: 'Mercedes-Benz O500', serviceType: 'Servicio Clásico', capacity: 44 }
  ];
  
  // Viaje base asignado al bus AND-501 (B1) de 08:00 a 16:00
  let trips = JSON.parse(localStorage.getItem('ea_trips')) || [
    {
      id: 'TRIP-101',
      routeId: 'R1',
      busId: 'B1',
      departure: '2026-10-15T08:00',
      arrival: '2026-10-15T16:00',
      status: 'EN_VENTA',
      soldSeats: [1, 2, 5, 12, 14]
    }
  ];
  
  let routes = JSON.parse(localStorage.getItem('ea_routes')) || defaultRoutes;
  let buses = JSON.parse(localStorage.getItem('ea_buses')) || defaultBuses;
  
  let activeTripForSeats = null;
  let currentSelectedSeat = null;
  
  // INICIALIZACIÓN
  document.addEventListener('DOMContentLoaded', () => {
    renderRoutes();
    renderBuses();
    renderTrips();
    updateStats();
    populateDropdowns();
  });
  
  // NAVEGACIÓN ENTRE SECCIONES
  function navigateTab(tabKey) {
    document.querySelectorAll('.tab-view').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.nav-btn').forEach(b => {
      b.classList.remove('active-nav');
      b.classList.add('text-slate-400');
    });
  
    const activeBtn = document.getElementById(`nav-${tabKey}`);
    const targetView = document.getElementById(`view-${tabKey}`);
    const mainBtn = document.getElementById('main-action-btn');
  
    targetView.classList.remove('hidden');
    activeBtn.classList.add('active-nav');
    activeBtn.classList.remove('text-slate-400');
  
    const titleEl = document.getElementById('view-title');
    const subEl = document.getElementById('view-subtitle');
  
    if (tabKey === 'trips') {
      titleEl.textContent = 'Programación de Viajes';
      subEl.textContent = 'Gestión de itinerarios, disponibilidad de buses y venta de boletos';
      mainBtn.classList.remove('hidden');
      mainBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Programar Nuevo Viaje';
      mainBtn.onclick = openTripModal;
    } else if (tabKey === 'routes') {
      titleEl.textContent = 'Rutas Interprovinciales';
      subEl.textContent = 'Gestión de orígenes, destinos y tarifas base';
      mainBtn.classList.add('hidden');
    } else {
      titleEl.textContent = 'Parque Automotor';
      subEl.textContent = 'Flota autorizada para transporte interprovincial';
      mainBtn.classList.add('hidden');
    }
  }
  
  // ----------------------------------------------------
  // GESTIÓN DE RUTAS
  // ----------------------------------------------------
  function renderRoutes() {
    const container = document.getElementById('routes-grid');
    container.innerHTML = routes.map(r => `
      <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative hover:border-blue-300 transition">
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-black tracking-wider bg-blue-50 text-blue-700 px-2.5 py-1 rounded">${r.id}</span>
          <span class="text-sm font-bold text-slate-800">S/ ${parseFloat(r.basePrice).toFixed(2)}</span>
        </div>
        <div class="space-y-1 mb-4">
          <p class="text-xs text-slate-400 font-semibold uppercase">Trayecto</p>
          <p class="font-bold text-slate-800 text-sm flex items-center gap-2">
            <span>${r.origin}</span>
            <i class="fa-solid fa-arrow-right text-xs text-slate-400"></i>
            <span class="text-blue-600">${r.destination}</span>
          </p>
        </div>
        <div class="text-xs text-slate-500 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span><i class="fa-solid fa-clock mr-1 text-slate-400"></i> Duración aprox:</span>
          <span class="font-semibold text-slate-700">${r.durationHours} hrs</span>
        </div>
      </div>
    `).join('');
  }
  
  function handleSaveRoute(e) {
    e.preventDefault();
    const origin = document.getElementById('route-origin').value.trim();
    const dest = document.getElementById('route-dest').value.trim();
    const hours = parseFloat(document.getElementById('route-hours').value);
    const price = parseFloat(document.getElementById('route-price').value);
  
    const newRoute = {
      id: `R${routes.length + 1}`,
      origin,
      destination: dest,
      durationHours: hours,
      basePrice: price
    };
  
    routes.push(newRoute);
    localStorage.setItem('ea_routes', JSON.stringify(routes));
    renderRoutes();
    populateDropdowns();
    updateStats();
    closeModal('route-modal');
    e.target.reset();
  }
  
  // ----------------------------------------------------
  // GESTIÓN DE BUSES
  // ----------------------------------------------------
  function renderBuses() {
    const container = document.getElementById('buses-grid');
    container.innerHTML = buses.map(b => `
      <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 transition">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-mono font-bold bg-slate-900 text-white px-2 py-0.5 rounded tracking-wider">${b.plate}</span>
          <span class="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Operativo</span>
        </div>
        <h4 class="font-bold text-slate-800 text-sm mt-2">${b.model}</h4>
        <p class="text-xs text-slate-500 mt-0.5">${b.serviceType}</p>
        <div class="mt-4 pt-3 border-t border-slate-100 flex justify-between text-xs text-slate-600">
          <span>Capacidad de Pasajeros:</span>
          <span class="font-bold text-slate-800">${b.capacity} asientos</span>
        </div>
      </div>
    `).join('');
  }
  
  function handleSaveBus(e) {
    e.preventDefault();
    const plate = document.getElementById('bus-plate').value.trim().toUpperCase();
    const serviceType = document.getElementById('bus-service').value;
    const capacity = parseInt(document.getElementById('bus-seats').value, 10);
  
    const newBus = {
      id: `B${buses.length + 1}`,
      plate,
      model: 'Marcopolo Paradiso 1800',
      serviceType,
      capacity
    };
  
    buses.push(newBus);
    localStorage.setItem('ea_buses', JSON.stringify(buses));
    renderBuses();
    populateDropdowns();
    updateStats();
    closeModal('bus-modal');
    e.target.reset();
  }
  
  // ----------------------------------------------------
  // HORARIOS Y ASIGNACIÓN (HU02, HU03, HU04)
  // ----------------------------------------------------
  function calculateArrivalAndValidate() {
    const routeSelect = document.getElementById('trip-route-select');
    const departureInput = document.getElementById('trip-departure');
    const arrivalInput = document.getElementById('trip-arrival');
  
    if (!routeSelect.value || !departureInput.value) {
      arrivalInput.value = '';
      return;
    }
  
    const selectedRoute = routes.find(r => r.id === routeSelect.value);
    if (!selectedRoute) return;
  
    const depDate = new Date(departureInput.value);
    const arrDate = new Date(depDate.getTime() + (selectedRoute.durationHours * 3600000));
  
    const tzOffset = arrDate.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(arrDate.getTime() - tzOffset)).toISOString().slice(0, 16);
    arrivalInput.value = localISOTime;
  
    validateBusAvailability();
  }
  
  function validateBusAvailability() {
    const busSelect = document.getElementById('trip-bus-select');
    const depInput = document.getElementById('trip-departure');
    const arrInput = document.getElementById('trip-arrival');
    const alertBox = document.getElementById('conflict-alert');
    const submitBtn = document.getElementById('trip-submit-btn');
  
    alertBox.classList.add('hidden');
    submitBtn.disabled = false;
  
    if (!busSelect.value || !depInput.value || !arrInput.value) return;
  
    const busId = busSelect.value;
    const newStart = new Date(depInput.value).getTime();
    const newEnd = new Date(arrInput.value).getTime();
    const BUFFER_MS = 60 * 60 * 1000; // 1 hora de margen
  
    const conflictingTrip = trips.find(trip => {
      if (trip.busId !== busId) return false;
      const existingStart = new Date(trip.departure).getTime();
      const existingEnd = new Date(trip.arrival).getTime() + BUFFER_MS;
      return (newStart < existingEnd && newEnd > existingStart);
    });
  
    if (conflictingTrip) {
      const routeObj = routes.find(r => r.id === conflictingTrip.routeId);
      alertBox.className = "p-3.5 rounded-lg border text-xs bg-rose-50 border-rose-200 text-rose-700 block";
      alertBox.innerHTML = `
        <div class="flex items-start gap-2">
          <i class="fa-solid fa-triangle-exclamation text-rose-600 mt-0.5"></i>
          <div>
            <strong class="font-bold">Conflicto de Horario Detectado:</strong>
            <p class="mt-0.5">El bus seleccionado ya tiene asignado el viaje <b>${conflictingTrip.id} (${routeObj?.origin || 'Lima'} &rarr; ${routeObj?.destination || 'Huaraz'})</b> en un horario superpuesto (08:00 a 16:00).</p>
          </div>
        </div>
      `;
      submitBtn.disabled = true;
    } else {
      alertBox.className = "p-3.5 rounded-lg border text-xs bg-emerald-50 border-emerald-200 text-emerald-700 block";
      alertBox.innerHTML = `
        <div class="flex items-center gap-2">
          <i class="fa-solid fa-circle-check text-emerald-600"></i>
          <span><strong>Bus Disponible:</strong> No presenta cruce de itinerarios para este rango.</span>
        </div>
      `;
    }
  }
  
  // SOLO ESTO SE CAMBIÓ: Poner la fecha y hora por defecto al abrir
  function openTripModal() {
    document.getElementById('trip-form').reset();
    populateDropdowns();
  
    // Fecha y hora listas:
    document.getElementById('trip-route-select').value = 'R1'; // Lima a Huaraz (8h)
    document.getElementById('trip-departure').value = '2026-10-15T10:00'; // Salida 10:00 AM
    document.getElementById('trip-arrival').value = '2026-10-15T18:00';   // Llegada 06:00 PM
    document.getElementById('trip-bus-select').value = 'B1';             // Bus AND-501
  
    // Valida el conflicto de una vez:
    validateBusAvailability();
  
    document.getElementById('trip-modal').classList.remove('hidden');
  }
  
  function handleSaveTrip(e) {
    e.preventDefault();
    const routeId = document.getElementById('trip-route-select').value;
    const busId = document.getElementById('trip-bus-select').value;
    const departure = new Date(document.getElementById('trip-departure').value).toISOString();
    const arrival = new Date(document.getElementById('trip-arrival').value).toISOString();
    const enableSale = document.getElementById('trip-enable-sale').checked;
  
    const newTrip = {
      id: `TRIP-${Math.floor(100 + Math.random() * 900)}`,
      routeId,
      busId,
      departure,
      arrival,
      status: enableSale ? 'EN_VENTA' : 'PROGRAMADO',
      soldSeats: []
    };
  
    trips.push(newTrip);
    localStorage.setItem('ea_trips', JSON.stringify(trips));
    renderTrips();
    updateStats();
    closeModal('trip-modal');
    e.target.reset();
  }
  
  // ----------------------------------------------------
  // TABLA DE VIAJES Y ESTADO DE VENTA
  // ----------------------------------------------------
  function renderTrips() {
    const tbody = document.getElementById('trips-table-body');
    if (trips.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center py-8 text-slate-400">No hay viajes programados en este momento.</td></tr>`;
      return;
    }
  
    tbody.innerHTML = trips.map(t => {
      const route = routes.find(r => r.id === t.routeId) || { origin: 'Lima (Javier Prado)', destination: 'Huaraz', basePrice: 65 };
      const bus = buses.find(b => b.id === t.busId) || { plate: 'AND-501', capacity: 40 };
      const depDate = new Date(t.departure).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' });
      const arrDate = new Date(t.arrival).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' });
  
      const isSaleActive = t.status === 'EN_VENTA';
  
      return `
        <tr class="hover:bg-slate-50 transition border-b border-slate-100">
          <td class="px-6 py-4 font-mono font-bold text-xs text-blue-600">${t.id}</td>
          <td class="px-6 py-4">
            <div class="font-bold text-slate-800 text-sm">${route.origin} &rarr; ${route.destination}</div>
          </td>
          <td class="px-6 py-4 text-xs text-slate-600">
            <div><span class="text-slate-400">Salida:</span> <b>${depDate}</b></div>
            <div><span class="text-slate-400">Llegada:</span> <b>${arrDate}</b></div>
          </td>
          <td class="px-6 py-4">
            <span class="bg-slate-100 text-slate-800 font-mono text-xs px-2.5 py-1 rounded font-semibold border border-slate-200">${bus.plate}</span>
            <span class="text-[11px] text-slate-500 block mt-0.5">${bus.capacity} asientos</span>
          </td>
          <td class="px-6 py-4 font-bold text-slate-800 text-sm">
            S/ ${parseFloat(route.basePrice).toFixed(2)}
          </td>
          <td class="px-6 py-4">
            ${isSaleActive
              ? `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> En Venta
                 </span>`
              : `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                  <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Programado
                 </span>`
            }
          </td>
          <td class="px-6 py-4 text-center space-x-2">
            ${!isSaleActive
              ? `<button onclick="toggleSaleStatus('${t.id}')" title="Habilitar Venta" class="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-1.5 rounded-lg transition">
                   <i class="fa-solid fa-cart-plus mr-1"></i> Habilitar
                 </button>`
              : `<button onclick="openSeatModal('${t.id}')" class="text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-1.5 rounded-lg transition">
                   <i class="fa-solid fa-chair mr-1"></i> Asientos (${t.soldSeats ? t.soldSeats.length : 0}/${bus.capacity})
                 </button>`
            }
            <button onclick="deleteTrip('${t.id}')" title="Eliminar Viaje" class="text-slate-400 hover:text-rose-600 text-sm p-1.5">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }
  
  function toggleSaleStatus(tripId) {
    const trip = trips.find(t => t.id === tripId);
    if (trip) {
      trip.status = trip.status === 'EN_VENTA' ? 'PROGRAMADO' : 'EN_VENTA';
      localStorage.setItem('ea_trips', JSON.stringify(trips));
      renderTrips();
      updateStats();
    }
  }
  
  function deleteTrip(tripId) {
    if (confirm(`¿Está seguro de anular el viaje ${tripId}?`)) {
      trips = trips.filter(t => t.id !== tripId);
      localStorage.setItem('ea_trips', JSON.stringify(trips));
      renderTrips();
      updateStats();
    }
  }
  
  // ----------------------------------------------------
  // MAPA DE ASIENTOS
  // ----------------------------------------------------
  function openSeatModal(tripId) {
    activeTripForSeats = trips.find(t => t.id === tripId);
    if (!activeTripForSeats) return;
  
    currentSelectedSeat = null;
    const route = routes.find(r => r.id === activeTripForSeats.routeId) || { origin: 'Lima', destination: 'Huaraz' };
    const bus = buses.find(b => b.id === activeTripForSeats.busId) || { plate: 'AND-501', capacity: 40, serviceType: 'Crucero VIP' };
  
    document.getElementById('seat-trip-info').textContent = 
      `${route.origin} -> ${route.destination} | Bus: ${bus.plate} (${bus.serviceType})`;
    document.getElementById('selected-seat-badge').textContent = 'Ninguno';
    document.getElementById('confirm-ticket-btn').disabled = true;
  
    const layout = document.getElementById('seat-layout-grid');
    layout.innerHTML = '';
  
    const sold = activeTripForSeats.soldSeats || [];
  
    for (let i = 1; i <= bus.capacity; i++) {
      const isSold = sold.includes(i);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `seat-button p-3 rounded-lg text-xs font-bold border transition ${
        isSold 
          ? 'bg-rose-500 text-white border-rose-600 cursor-not-allowed opacity-90' 
          : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
      }`;
      btn.innerHTML = `<i class="fa-solid fa-couch block mb-1 text-sm"></i>${i}`;
      btn.disabled = isSold;
  
      if (!isSold) {
        btn.onclick = () => selectSeat(i, btn);
      }
  
      layout.appendChild(btn);
    }
  
    document.getElementById('seat-modal').classList.remove('hidden');
  }
  
  function selectSeat(seatNumber, element) {
    document.querySelectorAll('.seat-button').forEach(b => {
      if (!b.disabled) {
        b.className = 'seat-button p-3 rounded-lg text-xs font-bold border bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 transition';
      }
    });
  
    element.className = 'seat-button p-3 rounded-lg text-xs font-bold border bg-blue-600 text-white border-blue-700 shadow-md transition';
    currentSelectedSeat = seatNumber;
    document.getElementById('selected-seat-badge').textContent = `Asiento N° ${seatNumber}`;
    document.getElementById('confirm-ticket-btn').disabled = false;
  }
  
  function confirmTicketSale() {
    if (!activeTripForSeats || !currentSelectedSeat) return;
  
    if (!activeTripForSeats.soldSeats) activeTripForSeats.soldSeats = [];
    activeTripForSeats.soldSeats.push(currentSelectedSeat);
    localStorage.setItem('ea_trips', JSON.stringify(trips));
    
    alert(`Boleto emitido con éxito para el Asiento N° ${currentSelectedSeat}`);
    closeModal('seat-modal');
    renderTrips();
  }
  
  // ----------------------------------------------------
  // UTILITARIOS
  // ----------------------------------------------------
  function populateDropdowns() {
    const routeSelect = document.getElementById('trip-route-select');
    const busSelect = document.getElementById('trip-bus-select');
  
    routeSelect.innerHTML = '<option value="">Seleccione una ruta...</option>' + 
      routes.map(r => `<option value="${r.id}">${r.origin} a ${r.destination} (${r.durationHours} hrs - S/${r.basePrice})</option>`).join('');
  
    busSelect.innerHTML = '<option value="">Seleccione una unidad vehicular...</option>' + 
      buses.map(b => `<option value="${b.id}">${b.plate} - ${b.model} (${b.capacity} asientos)</option>`).join('');
  }
  
  function updateStats() {
    document.getElementById('stat-total').textContent = trips.length;
    document.getElementById('stat-onsale').textContent = trips.filter(t => t.status === 'EN_VENTA').length;
    document.getElementById('stat-buses').textContent = buses.length;
    document.getElementById('stat-routes').textContent = routes.length;
  }
  
  function openRouteModal() { document.getElementById('route-modal').classList.remove('hidden'); }
  function openBusModal() { document.getElementById('bus-modal').classList.remove('hidden'); }
  
  function closeModal(id) {
    document.getElementById(id).classList.add('hidden');
  }