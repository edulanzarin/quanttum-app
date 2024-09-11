// Mock data
const tasks = {
    '2024-09-15': 'Tarefa importante: Revisão',
    '2024-09-20': 'Apresentação de resultados',
    '2024-09-25': 'Prazo final de relatório'
  };
  
  // Função para gerar o calendário
  function generateCalendar(month, year) {
    const daysInMonth = new Date(year, month + 1, 0).getDate(); // Total de dias no mês
    const firstDayOfWeek = new Date(year, month, 1).getDay(); // Dia da semana do primeiro dia
  
    const calendarGrid = document.querySelector('.calendar-grid');
    calendarGrid.innerHTML = ''; // Limpar o calendário
  
    // Preencher com dias vazios até o primeiro dia da semana
    for (let i = 0; i < firstDayOfWeek; i++) {
      const emptyDay = document.createElement('div');
      emptyDay.classList.add('calendar-day');
      calendarGrid.appendChild(emptyDay);
    }
  
    // Preencher dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
      const calendarDay = document.createElement('div');
      calendarDay.classList.add('calendar-day');
      calendarDay.textContent = day;
  
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  
      // Adicionar evento de clique para abrir o modal, com ou sem tarefa
      calendarDay.addEventListener('click', () => openModal(dateKey, tasks[dateKey] || 'Nenhuma tarefa para este dia'));
  
      calendarGrid.appendChild(calendarDay);
    }
  }
  
  // Função para abrir o modal
  function openModal(date, task) {
    const modal = document.getElementById('dayModal');
    const modalBody = document.getElementById('modal-body');
  
    modalBody.innerHTML = `<p><strong>Data:</strong> ${date}</p><p><strong>Tarefa:</strong> ${task}</p>`;
    modal.style.display = 'block';
  }
  
  // Fechar modal
  const modal = document.getElementById('dayModal');
  const closeModal = document.querySelector('.modal-content .close');
  
  closeModal.onclick = () => {
    modal.style.display = 'none';
  };
  
  window.onclick = function(event) {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  };
  
  // Inicializar o calendário
  const currentDate = new Date();
  let currentMonth = currentDate.getMonth();
  let currentYear = currentDate.getFullYear();
  
  document.querySelector('.prev-month').addEventListener('click', () => {
    currentMonth--;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
    generateCalendar(currentMonth, currentYear);
    updateMonthLabel();
  });
  
  document.querySelector('.next-month').addEventListener('click', () => {
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    generateCalendar(currentMonth, currentYear);
    updateMonthLabel();
  });
  
  // Função para atualizar o label do mês
  function updateMonthLabel() {
    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    document.getElementById('current-month').textContent = `${monthNames[currentMonth]} ${currentYear}`;
  }
  
  generateCalendar(currentMonth, currentYear);
  updateMonthLabel();
  