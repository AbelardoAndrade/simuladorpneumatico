const safetyLimits = {
    maxPressure: 8,
    minPressure: 1,
    maxTemperature: 55,
    minTemperature: 10,
    maxCycleSpeed: 1.8,
    minCycleSpeed: 0.2,
    maxAirFlow: 120,
    optimalPressureRange: {min: 4.5, max: 6.5},
    optimalTemperatureRange: {min: 20, max: 30},
    optimalCycleSpeedRange: {min: 0.6, max: 1.3},
    warningThreshold: 0.85,
    emergencyTemp: 50, // Lowered for earlier intervention
    coolingThreshold: 35, // Lowered for earlier cooling
    idealTemp: 25,
    tempRiseRate: 0.02, // Reduced for more gradual changes
    tempRiseRateHigh: 0.05,
    coolingRate: 0.4, // Increased cooling effectiveness
    emergencyShutdownDelay: 2000 // 2 seconds delay before emergency shutdown
  };
  
  // Circuit state and configuration
  const circuit = {
    isRunning: false,
    pressure: 6.0,
    temperature: 20,
    cycleSpeed: 1.0,
    pistonPosition: 0,
    pistonSpeed: 0,
    airFlow: 0,
    efficiency: 0,
    valveOpen: false,
    warnings: [],
    safetyStatus: 'normal',
    isInOptimalRange: true,
    cooling: false,
    emergencyShutdownTimer: null,
    lastWarningTime: 0,
    warningInterval: 1000, // Minimum time between warnings
    filterLifespan: 100, // Initial filter life in percentage
    filterUsageRate: 0.01, // Base rate of filter degradation
  };
  
  // DOM Elements
  const startBtn = document.getElementById('startBtn');
  const resetBtn = document.getElementById('resetBtn');
  const valveStateBtn = document.getElementById('valveStateBtn');
  const pressureInput = document.getElementById('pressureInput');
  const cycleSpeedInput = document.getElementById('cycleSpeed');
  const safetyStatusEl = document.getElementById('safetyStatus');
  const warningsListEl = document.getElementById('warningsList');
  const valveStatusEl = document.getElementById('valveStatus');
  
  // Animation elements
  const piston = document.getElementById('piston');
  const pistonRod = document.getElementById('piston-rod');
  const valve = document.getElementById('valve');
  
  // Check safety limits
  function checkSafetyLimits() {
    circuit.warnings = [];
    circuit.isInOptimalRange = true;
    let criticalConditionsCount = 0;
  
    // Pressure monitoring
    const pressureCheck = () => {
      if (circuit.pressure >= safetyLimits.maxPressure) {
        circuit.warnings.push(`CRÍTICO: Pressão excedeu limite máximo (${safetyLimits.maxPressure} bar)`);
        criticalConditionsCount++;
      } else if (circuit.pressure > safetyLimits.maxPressure * safetyLimits.warningThreshold) {
        circuit.warnings.push(`ALERTA: Pressão aproximando-se do limite máximo`);
        circuit.isInOptimalRange = false;
      }
      
      if (circuit.pressure < safetyLimits.minPressure) {
        circuit.warnings.push(`ALERTA: Pressão abaixo do mínimo seguro`);
        circuit.isInOptimalRange = false;
      }
    };
  
    // Temperature monitoring
    const temperatureCheck = () => {
      if (circuit.temperature >= safetyLimits.emergencyTemp) {
        circuit.warnings.push(`CRÍTICO: Temperatura excedeu limite de emergência`);
        criticalConditionsCount++;
      } else if (circuit.temperature > safetyLimits.maxTemperature) {
        circuit.warnings.push(`ALERTA: Temperatura acima do limite máximo`);
        circuit.isInOptimalRange = false;
      }
      
      if (circuit.temperature < safetyLimits.minTemperature) {
        circuit.warnings.push(`ALERTA: Temperatura abaixo do mínimo seguro`);
        circuit.isInOptimalRange = false;
      }
    };
  
    // Speed monitoring
    const speedCheck = () => {
      if (circuit.cycleSpeed > safetyLimits.maxCycleSpeed) {
        circuit.warnings.push(`CRÍTICO: Velocidade de ciclo muito alta`);
        criticalConditionsCount++;
      } else if (circuit.cycleSpeed > safetyLimits.maxCycleSpeed * safetyLimits.warningThreshold) {
        circuit.warnings.push(`ALERTA: Velocidade aproximando-se do limite`);
        circuit.isInOptimalRange = false;
      }
    };
  
    // Run all checks
    pressureCheck();
    temperatureCheck();
    speedCheck();
  
    // Update system status
    if (criticalConditionsCount > 0) {
      circuit.safetyStatus = 'critical';
      // Implement delayed emergency shutdown
      if (!circuit.emergencyShutdownTimer) {
        circuit.emergencyShutdownTimer = setTimeout(() => {
          stopSimulation();
          resetSystem();
          showEmergencyModal(); // Show modal after system reset
          circuit.emergencyShutdownTimer = null;
        }, safetyLimits.emergencyShutdownDelay);
      }
    } else {
      if (circuit.emergencyShutdownTimer) {
        clearTimeout(circuit.emergencyShutdownTimer);
        circuit.emergencyShutdownTimer = null;
      }
      circuit.safetyStatus = circuit.warnings.length > 0 ? 'warning' : 'normal';
    }
  
    // Update interface elements
    updateSafetyDisplay();
  }
  
  // Add new function to update safety display
  function updateSafetyDisplay() {
    const statusText = {
      normal: 'Sistema operando normalmente',
      warning: 'Sistema em estado de alerta',
      critical: 'CONDIÇÃO CRÍTICA - Preparando parada de emergência'
    };
  
    safetyStatusEl.className = `safety-status status-${circuit.safetyStatus}`;
    safetyStatusEl.textContent = statusText[circuit.safetyStatus];
    
    warningsListEl.innerHTML = circuit.warnings
      .map(warning => `<div class="safety-status status-${warning.includes('CRÍTICO') ? 'critical' : 'warning'}">${warning}</div>`)
      .join('');
  }
  
  // Initialize display values
  function updateDisplay() {
    document.getElementById('pressureValue').textContent = circuit.pressure.toFixed(1);
    document.getElementById('pistonSpeed').textContent = circuit.pistonSpeed.toFixed(1);
    document.getElementById('pistonPosition').textContent = circuit.pistonPosition.toFixed(1);
    document.getElementById('temperature').textContent = circuit.temperature.toFixed(1);
    document.getElementById('efficiency').textContent = circuit.efficiency.toFixed(1);
    
    // Update filter lifespan display
    const filterStatus = circuit.filterLifespan > 50 ? 'good' : 
                        circuit.filterLifespan > 20 ? 'warning' : 
                        'critical';
    
    document.getElementById('filterLifespan').textContent = Math.round(circuit.filterLifespan);
    document.getElementById('filterStatus').className = `warning-indicator ${filterStatus}`;
    document.getElementById('filterGauge').style.width = `${circuit.filterLifespan}%`;
    
    // Update gauges
    document.getElementById('pressureGauge').style.width = (circuit.pressure / 10 * 100) + '%';
    document.getElementById('speedGauge').style.width = (circuit.pistonSpeed / 100 * 100) + '%';
    document.getElementById('positionGauge').style.width = (circuit.pistonPosition / 200 * 100) + '%';
    document.getElementById('tempGauge').style.width = (circuit.temperature / 100 * 100) + '%';
    document.getElementById('efficiencyGauge').style.width = circuit.efficiency + '%';
    
    // Update safety status
    safetyStatusEl.className = `safety-status status-${circuit.safetyStatus}`;
    safetyStatusEl.textContent = circuit.safetyStatus === 'normal' ? 
      'Sistema operando normalmente' : 
      'Sistema em estado de alerta';
      
    // Update warnings
    warningsListEl.innerHTML = circuit.warnings.map(w => 
      `<div class="safety-status status-warning">${w}</div>`).join('');
  }

  // Adicionar uma nova variável para direção
circuit.pistonDirection = 1; // 1 para avançar, -1 para retornar
  
  // Animation loop
  function updateAnimation() {
    if (!circuit.isRunning) return;
    
  // Atualize a posição com base na direção
circuit.pistonPosition += circuit.pistonDirection * circuit.cycleSpeed;

// Inverta a direção se atingir os limites
if (circuit.pistonPosition >= 200) {
    circuit.pistonDirection = -1; // Troca para retornar
} else if (circuit.pistonPosition <= 0) {
    circuit.pistonDirection = 1; // Troca para avançar
}
    piston.setAttribute('x', -90 + circuit.pistonPosition);
    pistonRod.setAttribute('x', -50 + circuit.pistonPosition);
    
    // Calculate system parameters
    circuit.pistonSpeed = circuit.cycleSpeed * 50;
  
    // Temperature management with more stability
    if (circuit.isRunning) {
      const targetTemp = safetyLimits.idealTemp + 
        (circuit.pressure - 6.0) * 2 + // Pressure influence
        (circuit.cycleSpeed - 1.0) * 3; // Speed influence
      
      // Smoother temperature changes
      const tempDiff = targetTemp - circuit.temperature;
      circuit.temperature += tempDiff * 0.05; // Gradual change
      
      // Apply cooling if needed
      if (circuit.temperature > safetyLimits.coolingThreshold) {
        circuit.cooling = true;
        circuit.temperature -= safetyLimits.coolingRate * 0.5;
      } else {
        circuit.cooling = false;
      }
      
      // Ensure temperature stays within reasonable bounds
      circuit.temperature = Math.max(
        safetyLimits.minTemperature,
        Math.min(safetyLimits.maxTemperature, circuit.temperature)
      );
    }
  
    // More accurate air flow calculation based on valve state and system conditions
    if (circuit.isRunning) {
      if (circuit.valveOpen) {
        // Base flow calculation considering pressure and cycle speed
        const baseFlow = circuit.pressure * circuit.cycleSpeed * 10;
        
        // Add flow variations based on piston movement and direction
        const pistonMovementFactor = Math.sin(circuit.pistonPosition * Math.PI / 100);
        const flowVariation = Math.abs(pistonMovementFactor) * 5;
        
        // Factor in pressure influence on flow rate
        const pressureFactor = Math.max(0.5, Math.min(1.5, circuit.pressure / 6.0));
        
        // Calculate total flow with pressure influence
        const totalFlow = (baseFlow + flowVariation) * pressureFactor;
        
        // Ensure minimum flow when system is running with open valve
        circuit.airFlow = Math.max(totalFlow, circuit.pressure * 2);
      } else {
        // Minimal leakage flow when valve is closed but system is running
        circuit.airFlow = circuit.pressure * 0.5;
      }
    } else {
      // No flow when system is stopped
      circuit.airFlow = 0;
    }
  
    // Update filter lifespan based on system operation
    if (circuit.isRunning && circuit.airFlow > 0) {
      // Increased degradation with higher pressure and flow
      const degradationMultiplier = (circuit.pressure / 6.0) * (circuit.airFlow / 100);
      circuit.filterLifespan -= circuit.filterUsageRate * degradationMultiplier;
      
      // Ensure filterLifespan doesn't go below 0
      circuit.filterLifespan = Math.max(0, circuit.filterLifespan);
      
      // Add warning if filter life is low
      if (circuit.filterLifespan < 20 && !circuit.warnings.includes('ALERTA: Filtro próximo ao fim da vida útil')) {
        circuit.warnings.push('ALERTA: Filtro próximo ao fim da vida útil');
      }
      if (circuit.filterLifespan < 5 && !circuit.warnings.includes('CRÍTICO: Filtro precisa ser substituído')) {
        circuit.warnings.push('CRÍTICO: Filtro precisa ser substituído');
      }
    }
    
    // Calculate efficiency based on optimal ranges
    circuit.efficiency = calculateEfficiency();
    
    // Safety checks
    checkSafetyLimits();
    updateDisplay();
    
    requestAnimationFrame(updateAnimation);
  }
  
  function calculateEfficiency() {
    let efficiency = 100;
    
    // Pressure efficiency - more forgiving curve
    const pressureOptimal = (safetyLimits.optimalPressureRange.max + safetyLimits.optimalPressureRange.min) / 2;
    const pressureDev = Math.abs(circuit.pressure - pressureOptimal);
    const pressurePenalty = Math.pow(pressureDev, 1.5) * 5;
    
    // Temperature efficiency - smoother curve
    const tempOptimal = safetyLimits.idealTemp;
    const tempDev = Math.abs(circuit.temperature - tempOptimal);
    const tempPenalty = Math.pow(tempDev, 1.2) * 1.5;
    
    // Speed efficiency - more gradual impact
    const speedOptimal = (safetyLimits.optimalCycleSpeedRange.max + safetyLimits.optimalCycleSpeedRange.min) / 2;
    const speedDev = Math.abs(circuit.cycleSpeed - speedOptimal);
    const speedPenalty = Math.pow(speedDev, 1.3) * 15;
    
    // Calculate total efficiency with more stability
    efficiency -= (pressurePenalty + tempPenalty + speedPenalty);
    
    // Add bonus for optimal operation
    if (circuit.isInOptimalRange) {
      efficiency += 5;
    }
    
    // Ensure efficiency stays within 0-100 range and add smoothing
    efficiency = Math.max(0, Math.min(100, efficiency));
    
    // Smooth changes by averaging with previous value
    if (typeof circuit.lastEfficiency === 'undefined') {
      circuit.lastEfficiency = efficiency;
    }
    efficiency = (efficiency * 0.3) + (circuit.lastEfficiency * 0.7);
    circuit.lastEfficiency = efficiency;
    
    return Math.round(efficiency);
  }
  
  // Control functions
  function startSimulation() {
    circuit.isRunning = true;
    startBtn.textContent = 'Parar Simulação';
    updateAnimation();
  }
  
  function stopSimulation() {
    circuit.isRunning = false;
    startBtn.textContent = 'Iniciar Simulação';
  }
  
  function resetSystem() {
    circuit.pressure = 6.0;
    circuit.temperature = 20;
    circuit.cycleSpeed = 1.0;
    circuit.pistonPosition = 0;
    circuit.pistonSpeed = 0;
    circuit.airFlow = 0;
    circuit.efficiency = 0;
    circuit.valveOpen = false;
    circuit.warnings = [];
    circuit.safetyStatus = 'normal';
    circuit.cooling = false;
    circuit.filterLifespan = 100; // Reset filter lifespan
  
    pressureInput.value = circuit.pressure;
    cycleSpeedInput.value = circuit.cycleSpeed;
    valveStatusEl.textContent = 'Estado: Fechada';
    
    stopSimulation();
    updateDisplay();
  }
  
  // Emergency modal functions
  function showEmergencyModal() {
    const modal = new bootstrap.Modal(document.getElementById('emergencyModal'));
    const detailsEl = document.getElementById('emergencyDetails');
    
    const detailsHTML = `
      <h3>Motivos da Parada:</h3>
      <ul class="list-group list-group-flush">
        ${circuit.warnings.map(warning => `<li class="list-group-item">${warning}</li>`).join('')}
      </ul>
      <div class="alert alert-warning mt-3">
        <p>O sistema foi resetado para configurações seguras.</p>
        <p>Por favor, verifique as configurações antes de reiniciar.</p>
      </div>
    `;
    
    detailsEl.innerHTML = detailsHTML;
    modal.show();
  }
  
  function closeEmergencyModal() {
    const modal = bootstrap.Modal.getInstance(document.getElementById('emergencyModal'));
    if (modal) {
      modal.hide();
    }
  }
  
  // Tour functionality
  const tourSteps = [
    {
      element: '.container h1',
      title: 'Bem-vindo ao Simulador Pneumático',
      content: 'Este simulador permite entender e experimentar com um sistema pneumático industrial básico. Vamos conhecer seus componentes principais.',
      position: 'bottom'
    },
    {
      element: '.safety-panel',
      title: 'Painel de Segurança',
      content: 'Monitora as condições de operação do sistema, exibindo alertas e status em tempo real. Também mostra as configurações ideais de operação.',
      position: 'right'
    },
    {
      element: '#startBtn',
      title: 'Controles Principais',
      content: 'Use estes botões para iniciar/parar a simulação e resetar o sistema para suas configurações originais.',
      position: 'bottom'
    },
    {
      element: '#pressureInput',
      title: 'Ajuste de Pressão',
      content: 'Controle a pressão de entrada do sistema. Mantenha entre 4.5-6.5 bar para operação ideal.',
      position: 'right'
    },
    {
      element: '#cycleSpeed',
      title: 'Velocidade do Ciclo',
      content: 'Ajuste a velocidade de operação do cilindro. Valores entre 0.6-1.3x são considerados ótimos.',
      position: 'right'
    },
    {
      element: '#valveStateBtn',
      title: 'Controle da Válvula',
      content: 'Alterna o estado da válvula direcional 5/2, controlando o fluxo de ar no sistema.',
      position: 'bottom'
    },
    {
      element: '.svg-container',
      title: 'Diagrama do Circuito',
      content: 'Visualização animada do circuito pneumático, incluindo compressor, filtros, válvulas e cilindro.',
      position: 'top'
    },
    {
      element: '.stats-grid',
      title: 'Monitoramento em Tempo Real',
      content: 'Acompanhe parâmetros importantes como pressão, temperatura, velocidade e eficiência do sistema.',
      position: 'top'
    }
  ];
  
  let currentTourStep = 0;
  const tourOverlay = document.getElementById('tourOverlay');
  const tourTooltip = document.getElementById('tourTooltip');
  const tourTitle = document.getElementById('tourTitle');
  const tourContent = document.getElementById('tourContent');
  const tourNext = document.getElementById('tourNext');
  const tourPrev = document.getElementById('tourPrev');
  const tourSkip = document.getElementById('tourSkip');
  
  function startTour() {
    currentTourStep = 0;
    tourOverlay.style.display = 'block';
    updateTourStep();
  }
  
  function endTour() {
    tourOverlay.style.display = 'none';
    document.querySelectorAll('.highlight, .elevated').forEach(el => {
      el.classList.remove('highlight', 'elevated');
      el.style.zIndex = '';
    });
  }
  
  function updateTourStep() {
    // First reset all previously elevated elements
    document.querySelectorAll('.elevated').forEach(el => {
      el.classList.remove('elevated');
      el.style.zIndex = '';
    });
  
    const step = tourSteps[currentTourStep];
    const element = document.querySelector(step.element);
    
    // Remove previous highlights
    document.querySelectorAll('.highlight').forEach(el => {
      el.classList.remove('highlight');
    });
    
    // Add highlight to current element and elevate it
    element.classList.add('highlight');
    element.classList.add('elevated');
    element.style.zIndex = '1002'; // Same as highlight z-index
    
    // Update tooltip content
    tourTitle.textContent = step.title;
    tourContent.textContent = step.content;
    
    // Position tooltip
    const elementRect = element.getBoundingClientRect();
    const tooltipRect = tourTooltip.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    
    // Calculate initial position
    let top, left;
    
    if (window.innerWidth <= 768) {
      // Mobile positioning
      top = elementRect.bottom + 20;
      left = '50%';
      tourTooltip.style.transform = 'translateX(-50%)';
    } else {
      // Desktop positioning
      switch(step.position) {
        case 'top':
          top = Math.max(20, elementRect.top - tooltipRect.height - 40);
          left = elementRect.left + (elementRect.width - tooltipRect.width) / 2;
          break;
        case 'bottom':
          top = Math.min(viewportHeight - tooltipRect.height - 20, elementRect.bottom + 20);
          left = elementRect.left + (elementRect.width - tooltipRect.width) / 2;
          break;
        case 'left':
          top = elementRect.top + (elementRect.height - tooltipRect.height) / 2;
          left = Math.max(20, elementRect.left - tooltipRect.width - 20);
          break;
        case 'right':
          top = elementRect.top + (elementRect.height - tooltipRect.height) / 2;
          left = Math.min(viewportWidth - tooltipRect.width - 20, elementRect.right + 20);
          break;
      }
      
      // Ensure tooltip stays within viewport
      top = Math.max(20, Math.min(viewportHeight - tooltipRect.height - 20, top));
      left = Math.max(20, Math.min(viewportWidth - tooltipRect.width - 20, left));
      
      tourTooltip.style.transform = 'none';
    }
    
    tourTooltip.style.top = `${top}px`;
    tourTooltip.style.left = typeof left === 'string' ? left : `${left}px`;
    
    // Update button states
    tourPrev.disabled = currentTourStep === 0;
    tourNext.textContent = currentTourStep === tourSteps.length - 1 ? 'Concluir' : 'Próximo';
  }
  
  // Add window resize handler
  window.addEventListener('resize', () => {
    if (tourOverlay.style.display === 'block') {
      updateTourStep();
    }
  });
  
  // Event listeners
  tourNext.addEventListener('click', () => {
    if (currentTourStep < tourSteps.length - 1) {
      currentTourStep++;
      updateTourStep();
    } else {
      endTour();
    }
  });
  
  tourPrev.addEventListener('click', () => {
    if (currentTourStep > 0) {
      currentTourStep--;
      updateTourStep();
    }
  });
  
  tourSkip.addEventListener('click', endTour);
  
  // Add tour button
  const headerDiv = document.querySelector('.container h1');
  const tourButton = document.createElement('button');
  tourButton.textContent = 'Iniciar Tour Guiado';
  tourButton.className = 'btn btn-outline-primary btn-sm ms-2';
  tourButton.addEventListener('click', startTour);
  headerDiv.appendChild(tourButton);
  
  // Event Listeners
  startBtn.addEventListener('click', () => {
    if (circuit.isRunning) {
      stopSimulation();
    } else {
      startSimulation();
    }
  });
  
  resetBtn.addEventListener('click', resetSystem);
  
  valveStateBtn.addEventListener('click', () => {
    circuit.valveOpen = !circuit.valveOpen;
    valveStatusEl.textContent = `Estado: ${circuit.valveOpen ? 'Aberta' : 'Fechada'}`;
  });
  
  pressureInput.addEventListener('input', (e) => {
    circuit.pressure = parseFloat(e.target.value);
    document.getElementById('pressureInputValue').textContent = circuit.pressure.toFixed(1);
    updateDisplay();
  });
  
  cycleSpeedInput.addEventListener('input', (e) => {
    circuit.cycleSpeed = parseFloat(e.target.value);
    document.getElementById('cycleSpeedValue').textContent = circuit.cycleSpeed.toFixed(1) + 'x';
    updateDisplay();
  });
  
  // Initial setup
  resetSystem();
  updateDisplay();