console.log("Script loaded");


// State management
let state = {
    transactions: [],
    activeType: 'expense',
    selectedCategory: 'expense',
    activeTab: 'input'
};

// Categories configuration
const categories = {
    expense: [
        { name: 'Utilities', icon: '⚡' },
        { name: 'Food', icon: '🍔' },
        { name: 'Transport', icon: '🚗' },
        { name: 'Shopping', icon: '🛍️' }
    ],
    income: [
        { name: 'Salary', icon: '💰' },
        { name: 'Freelance', icon: '💻' },
        { name: 'Investments', icon: '📈' },
        { name: 'Other', icon: '🎁' }
    ]
};

// DOM Elements
const transactionForm = document.getElementById('transactionForm');
const transactionContainer = document.getElementById('transactionContainer');
const toggleBtns = document.querySelectorAll('.toggle-btn');
const categoryGrid = document.querySelector('.category-grid');
const navItems = document.querySelectorAll('.nav-item');
const totalExpense = document.getElementById('totalExpense');
const totalIncome = document.getElementById('totalIncome');
const totalBalance = document.getElementById('totalBalance');
let pieChart = null;

// Event Listeners
// document.addEventListener('DOMContentLoaded', initializeApp);

document.addEventListener('DOMContentLoaded', () => {
    loadTransactions();
    document.getElementById('date').valueAsDate = new Date();
    renderCategories();
    renderCalendar();
});

transactionForm.addEventListener('submit', handleTransactionSubmit);
toggleBtns.forEach(btn => btn.addEventListener('click', handleTypeToggle));
navItems.forEach(item => item.addEventListener('click', handleNavigation));

function initializeApp() {
    // Load transactions from localStorage
    // const savedTransactions = localStorage.getItem('transactions');
    // if (savedTransactions) {
    //     state.transactions = JSON.parse(savedTransactions);
    //     renderTransactions();
    //     updateTotals();
    // }

    // Set current date as default
    document.getElementById('date').valueAsDate = new Date();
    
    // Initialize category grid
    renderCategories();
    
    // Initialize pie chart
    updatePieChart();

    renderCalendar();

}

function renderCategories() {
    categoryGrid.innerHTML = '';
    
    categories[state.activeType].forEach(category => {
        const categoryElement = document.createElement('div');
        categoryElement.className = 'category-item';
        categoryElement.dataset.category = category.name;
        
        categoryElement.innerHTML = `
            <span class="category-icon">${category.icon}</span>
            <span>${category.name}</span>
        `;
        
        categoryElement.addEventListener('click', () => handleCategorySelect(category.name));
        
        if (state.selectedCategory === category.name) {
            categoryElement.classList.add('active');
        }
        
        categoryGrid.appendChild(categoryElement);
    });
}

function handleTypeToggle(e) {
    const type = e.target.dataset.type;
    state.activeType = type;
    state.selectedCategory = ''; // Reset selected category
    
    // Update UI
    toggleBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.type === type);
    });
    
    // Update categories and chart
    renderCategories();
    updatePieChart();
}

function handleCategorySelect(categoryName) {
    state.selectedCategory = categoryName;
    
    // Update UI
    document.querySelectorAll('.category-item').forEach(item => {
        item.classList.toggle('active', item.dataset.category === categoryName);
    });
}

// function handleTransactionSubmit(e) {
//     e.preventDefault();

//     const amount = parseFloat(document.getElementById('amount').value);
//     const date = document.getElementById('date').value;

//     if (!state.selectedCategory || !amount || !date) {
//         alert('Please fill in all fields and select a category');
//         return;
//     }

//     const transaction = {
//         id: Date.now(),
//         type: state.activeType,
//         category: state.selectedCategory,
//         amount,
//         date
//     };

//     state.transactions.unshift(transaction);
//     saveTransactions();
//     renderTransactions();
//     updateTotals();
//     updatePieChart();
    
//     // Reset form
//     transactionForm.reset();
//     document.getElementById('date').valueAsDate = new Date();
//     state.selectedCategory = '';
//     renderCategories();
// }


async function handleTransactionSubmit(e) {
    e.preventDefault();

    const rawAmount = document.getElementById('amount').value;
    const amount = parseFloat(rawAmount);
    const date = document.getElementById('date').value;

    if (!state.selectedCategory || isNaN(amount) || !date) {
        alert('Please fill in all fields and ensure amount is a valid number');
        return;
    }

    const transaction = {
        type: state.activeType,
        category: state.selectedCategory,
        amount: amount,
        date
    };

    try {
        console.log('Sending transaction:', transaction); // Debug log
        
        const response = await fetch('transactions.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(transaction)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to save transaction');
        }
        
        const savedTransaction = await response.json();
        console.log('Received saved transaction:', savedTransaction); // Debug log
        
        // Ensure amount is a valid number
        savedTransaction.amount = parseFloat(savedTransaction.amount);
        if (isNaN(savedTransaction.amount)) {
            throw new Error('Invalid amount returned from server');
        }
        
        state.transactions.unshift(savedTransaction);
        renderTransactions();
        updateTotals();
        updatePieChart();
        
        // Reset form
        transactionForm.reset();
        document.getElementById('date').valueAsDate = new Date();
        state.selectedCategory = '';
        renderCategories();
    } catch (error) {
        console.error('Error saving transaction:', error);
        alert('Failed to save transaction. Please try again.');
    }
}

function handleNavigation(e) {
    const tab = e.currentTarget.dataset.tab;
    state.activeTab = tab;
    
    // Update UI
    navItems.forEach(item => {
        item.classList.toggle('active', item.dataset.tab === tab);
    });

    // Show/hide sections based on active tab
    const sections = {
        'input': document.querySelector('.transaction-form'),
        'analysis': document.querySelector('.pie-chart-container'),
        'calendar': document.querySelector('.calendar-view-container')
    };

    Object.entries(sections).forEach(([key, element]) => {
        if (element) {
            element.style.display = key === tab ? 'block' : 'none';
        }
    });

    // Update pie chart when switching to analysis tab
    if (tab === 'analysis') {
        updatePieChart();
    }
}

function updatePieChart() {
    const ctx = document.getElementById('pieChart');
    if (!ctx) return;

    // Destroy existing chart if it exists
    if (pieChart) {
        pieChart.destroy();
    }

    // Calculate totals by category for the active type
    const categoryTotals = state.transactions
        .filter(t => t.type === state.activeType)
        .reduce((acc, transaction) => {
            acc[transaction.category] = (acc[transaction.category] || 0) + transaction.amount;
            return acc;
        }, {});

    const data = {
        labels: Object.keys(categoryTotals),
        datasets: [{
            data: Object.values(categoryTotals),
            backgroundColor: [
                '#FF6384',
                '#36A2EB',
                '#FFCE56',
                '#4BC0C0',
                '#9966FF',
                '#FF9F40'
            ]
        }]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right',
                labels: {
                    padding: 20,
                    font: {
                        size: 14
                    }
                }
            },
            title: {
                display: true,
                text: `${state.activeType.charAt(0).toUpperCase() + state.activeType.slice(1)} Distribution`,
                font: {
                    size: 18
                }
            }
        }
    };

    pieChart = new Chart(ctx, {
        type: 'pie',
        data: data,
        options: options
    });
}

function renderTransactions() {
    transactionContainer.innerHTML = '';
    
    state.transactions.forEach(transaction => {
        const element = createTransactionElement(transaction);
        transactionContainer.appendChild(element);
    });
}

// function createTransactionElement(transaction) {
//     const div = document.createElement('div');
//     div.className = 'transaction-item';
    
//     div.innerHTML = `
//         <div class="transaction-info">
//             <span class="transaction-category">${transaction.category}</span>
//             <span class="transaction-date">${formatDate(transaction.date)}</span>
//         </div>
//         <span class="transaction-amount ${transaction.type}">
//             ${transaction.type === 'expense' ? '-' : '+'}₹${transaction.amount.toFixed(2)}
//         </span>
//     `;
    
//     return div;
// }


function createTransactionElement(transaction) {
    const div = document.createElement('div');
    div.className = 'transaction-item';
    
    // Safely convert amount to number and handle invalid values
    const amount = parseFloat(transaction.amount);
    const displayAmount = !isNaN(amount) ? amount.toFixed(2) : '0.00';
    
    div.innerHTML = `
        <div class="transaction-info">
            <span class="transaction-category">${transaction.category}</span>
            <span class="transaction-date">${formatDate(transaction.date)}</span>
        </div>
        <div style="display: flex; align-items: center;">
            <span class="transaction-amount ${transaction.type}">
                ${transaction.type === 'expense' ? '-' : '+'}₹${displayAmount}
            </span>
            <button class="delete-btn" data-id="${transaction.id}" 
            style="
            margin-left: 8px;
            background: none;
            border: none;
            color: red;
            cursor: pointer;
            font-size: 1.2em;">
            🗑️
            </button>
        </div>
    `;

    div.querySelector('.delete-btn').addEventListener('click', () => handleDeleteTransaction(transaction.id));
    return div;
}


// function handleDeleteTransaction(transactionId) {
//     // Remove transaction from the state
//     state.transactions = state.transactions.filter(transaction => transaction.id !== transactionId);

//     // Save updated transactions to localStorage
//     saveTransactions();

//     // Re-render transactions and update totals
//     renderTransactions();
//     updateTotals();
//     updatePieChart();
// }


async function handleDeleteTransaction(transactionId) {
    try {
        const response = await fetch(`transactions.php?id=${transactionId}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Failed to delete transaction');

        // Remove from state only after successful server delete
        state.transactions = state.transactions.filter(t => t.id !== transactionId);
        renderTransactions();
        updateTotals();
        updatePieChart();
    } catch (error) {
        console.error('Error deleting transaction:', error);
        alert('Failed to delete transaction. Please try again.');
    }
}



function updateTotals() {
    const totals = state.transactions.reduce((acc, transaction) => {
        const amount = parseFloat(transaction.amount);
        if (!isNaN(amount)) {
            if (transaction.type === 'expense') {
                acc.expenses += amount;
            } else {
                acc.income += amount;
            }
        }
        return acc;
    }, { expenses: 0, income: 0 });

    const balance = totals.income - totals.expenses;

    totalExpense.textContent = `₹${totals.expenses.toFixed(2)}`;
    totalIncome.textContent = `₹${totals.income.toFixed(2)}`;
    totalBalance.textContent = `₹${balance.toFixed(2)}`;
}



function saveTransactions() {
    // localStorage.setItem('transactions', JSON.stringify(state.transactions));
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Add animation class when new transactions are added
function animateTransaction(element) {
    element.classList.add('animate-slide-in');
    element.addEventListener('animationend', () => {
        element.classList.remove('animate-slide-in');
    });
}

// Initialize the app with some animations
document.querySelectorAll('.animate-fade-in').forEach(element => {
    element.style.opacity = '0';
    setTimeout(() => {
        element.style.opacity = '1';
    }, 100);
});

// Add this to your existing script.js file

// Add this to your DOM Elements section
const downloadCSV = document.getElementById('downloadCSV');

// Add this to your Event Listeners section
downloadCSV.addEventListener('click', handleDownloadCSV);

function handleDownloadCSV() {
    // Create CSV content
    const headers = ['Date', 'Type', 'Category', 'Amount'];
    const csvContent = state.transactions.map(transaction => {
        return [
            transaction.date,
            transaction.type,
            transaction.category,
            transaction.amount
        ].join(',');
    });
    
    // Add headers to the beginning
    csvContent.unshift(headers.join(','));
    
    // Create CSV blob
    const csvString = csvContent.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    
    // Create download link
    const link = document.createElement('a');
    if (navigator.msSaveBlob) { // IE 10+
        navigator.msSaveBlob(blob, 'transactions.csv');
    } else {
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.download = `expense-tracker-${formatDateForFilename(new Date())}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}

function formatDateForFilename(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Modify the handleNavigation function to show/hide the download button
function handleNavigation(e) {
    const tab = e.currentTarget.dataset.tab;
    state.activeTab = tab;
    
    // Update UI
    navItems.forEach(item => {
        item.classList.toggle('active', item.dataset.tab === tab);
    });

    // Show/hide sections based on active tab
    const pieChartContainer = document.querySelector('.pie-chart-container');
    const transactionForm = document.querySelector('.transaction-form');
    const transactionList = document.querySelector('.transaction-list');

    if (tab === 'analysis') {
        pieChartContainer.style.display = 'block';
        transactionForm.style.display = 'none';
        transactionList.style.display = 'none';
        updatePieChart();
    } else if (tab === 'input') {
        pieChartContainer.style.display = 'none';
        transactionForm.style.display = 'block';
        transactionList.style.display = 'block';
    }
}

// Add to your state object
state.currentDate = new Date();

// Add to your DOM Elements section
const prevMonth = document.getElementById('prevMonth');
const nextMonth = document.getElementById('nextMonth');
const currentMonth = document.getElementById('currentMonth');
const calendarGrid = document.getElementById('calendarGrid');

// Add to your Event Listeners section
prevMonth.addEventListener('click', () => navigateMonth(-1));
nextMonth.addEventListener('click', () => navigateMonth(1));

function navigateMonth(delta) {
    state.currentDate.setMonth(state.currentDate.getMonth() + delta);
    renderCalendar();
}

function renderCalendar() {
    const year = state.currentDate.getFullYear();
    const month = state.currentDate.getMonth();
    
    // Update month display
    currentMonth.textContent = new Date(year, month, 1)
        .toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    // Clear existing calendar
    calendarGrid.innerHTML = '';
    
    // Add weekday headers
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    weekdays.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'weekday-header';
        dayHeader.textContent = day;
        calendarGrid.appendChild(dayHeader);
    });

    // Get first day of month and total days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Get previous month's days needed
    const prevMonthDays = new Date(year, month, 0).getDate();
    
    // Create calendar grid
    let date = 1;
    let nextMonthDate = 1;
    
    // Calculate total cells needed (42 ensures we always have 6 rows)
    for (let i = 0; i < 42; i++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day';
        
        if (i < firstDay) {
            // Previous month
            const prevDate = prevMonthDays - firstDay + i + 1;
            dayCell.innerHTML = `
                <div class="day-header">${prevDate}</div>
                <div class="day-transactions"></div>
            `;
            dayCell.classList.add('other-month');
        } else if (date > daysInMonth) {
            // Next month
            dayCell.innerHTML = `
                <div class="day-header">${nextMonthDate}</div>
                <div class="day-transactions"></div>
            `;
            dayCell.classList.add('other-month');
            nextMonthDate++;
        } else {
            // Current month
            const currentDate = new Date(year, month, date);
            const isToday = isSameDate(currentDate, new Date());
            
            if (isToday) {
                dayCell.classList.add('today');
            }
            
            dayCell.innerHTML = `
                <div class="day-header">${date}</div>
                <div class="day-transactions"></div>
            `;
            
            // Add transactions for this date
            const dayTransactions = state.transactions.filter(t => 
                isSameDate(new Date(t.date), currentDate)
            );
            
            const transactionsContainer = dayCell.querySelector('.day-transactions');
            dayTransactions.forEach(transaction => {
                const transactionEl = document.createElement('div');
                transactionEl.className = `calendar-transaction ${transaction.type}`;
                transactionEl.textContent = `${transaction.category}: ₹${transaction.amount}`;
                transactionsContainer.appendChild(transactionEl);
            });
            
            date++;
        }
        
        calendarGrid.appendChild(dayCell);
    }
}

function isSameDate(date1, date2) {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
}

// Modify handleNavigation to include calendar view
function handleNavigation(e) {
    const tab = e.currentTarget.dataset.tab;
    state.activeTab = tab;
    
    // Update UI
    navItems.forEach(item => {
        item.classList.toggle('active', item.dataset.tab === tab);
    });

    // Show/hide sections
    const pieChartContainer = document.querySelector('.pie-chart-container');
    const transactionForm = document.querySelector('.transaction-form');
    const transactionList = document.querySelector('.transaction-list');
    const calendarView = document.querySelector('.calendar-view-container');

    // Hide all sections first
    pieChartContainer.style.display = 'none';
    transactionForm.style.display = 'none';
    transactionList.style.display = 'none';
    calendarView.style.display = 'none';

    // Show appropriate section
    switch(tab) {
        case 'analysis':
            pieChartContainer.style.display = 'block';
            updatePieChart();
            break;
        case 'input':
            transactionForm.style.display = 'block';
            transactionList.style.display = 'block';
            break;
        case 'calendar':
            calendarView.style.display = 'block';
            renderCalendar();
            break;
    }
}





async function loadTransactions() {
    try {
        const response = await fetch('transactions.php');
        if (!response.ok) throw new Error('Failed to load transactions');
        
        const transactions = await response.json();
        console.log('Loaded transactions:', transactions); // Debug log
        
        // Explicitly convert amounts to numbers and validate
        state.transactions = transactions.map(t => {
            const parsedAmount = parseFloat(t.amount);
            if (isNaN(parsedAmount)) {
                console.error('Invalid amount for transaction:', t);
                return { ...t, amount: 0 }; // Fallback to 0 for invalid amounts
            }
            return { ...t, amount: parsedAmount };
        });
        
        console.log('Processed transactions:', state.transactions); // Debug log
        renderTransactions();
        updateTotals();
        updatePieChart();
    } catch (error) {
        console.error('Error loading transactions:', error);
        alert('Error loading transactions. Please refresh the page.');
    }
}


