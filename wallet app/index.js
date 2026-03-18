import { initializeApp } from "https://www.gstatic.com/firebasejs/9.20.0/firebase-app.js"
import { getDatabase, ref, push, onValue, remove } from "https://www.gstatic.com/firebasejs/9.20.0/firebase-database.js"

// ✅ Firebase configuration - Replace with YOUR Firebase project URL
const firebaseConfig = {
  databaseURL: "https://lunchvote-b0b38-default-rtdb.asia-southeast1.firebasedatabase.app/"
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig)
const database = getDatabase(app)
const expensesRef = ref(database, "expenses")  // expenses stored in Firebase
const travelersRef = ref(database, "travelers") // travelers stored in Firebase

// ✅ Retrieve necessary elements
const expenseForm = document.getElementById("expense-form");
const totalExpensesAmountElement = document.getElementById("total-expenses-amount");
const expenseList = document.getElementById("expense-list");
const modal = document.getElementById("travelers-modal");
const openModalButton = document.getElementById("open-modal-button");
const closeButton = document.querySelector(".close-button");
const travelersForm = document.getElementById("travelers-form");
const travelerNameInput = document.getElementById("traveler-name");
const travelersList = document.getElementById("travelers-list");

// ✅ These will be kept in sync with Firebase
let expenses = [];
let travelers = [];

// -------------------------------------------------------
// MODAL CONTROLS
// -------------------------------------------------------

openModalButton.addEventListener("click", function () {
  modal.classList.add("display-modal");
});

closeButton.addEventListener("click", function () {
  modal.classList.remove("display-modal");
});

window.addEventListener("click", function (event) {
  if (event.target === modal) {
    modal.classList.remove("display-modal");
  }
});

// -------------------------------------------------------
// FORM SUBMISSIONS
// -------------------------------------------------------

// Handle new expense form submission
expenseForm.addEventListener("submit", function (event) {
  event.preventDefault();
  handleNewExpense();
});

// Handle new traveler form submission
travelersForm.addEventListener("submit", function (event) {
  event.preventDefault();
  handleNewTraveler();
});

// -------------------------------------------------------
// ADD NEW EXPENSE → saved to Firebase
// -------------------------------------------------------
function handleNewExpense() {
  const category = document.getElementById("expense-category").value;
  const amount = parseInt(document.getElementById("expense-amount").value);

  if (!amount || amount <= 0) return; // ✅ prevent empty/invalid entries

  // Push to Firebase instead of local array
  push(expensesRef, { category, amount });
  expenseForm.reset();
}

// -------------------------------------------------------
// ADD NEW TRAVELER → saved to Firebase
// -------------------------------------------------------
function handleNewTraveler() {
  const travelerName = travelerNameInput.value.trim();
  if (travelerName !== "") {
    push(travelersRef, { name: travelerName, amountOwed: 0 });
    travelerNameInput.value = "";
  }
}

// -------------------------------------------------------
// LISTEN TO FIREBASE - EXPENSES (real-time sync)
// -------------------------------------------------------
onValue(expensesRef, function (snapshot) {
  expenses = [];
  expenseList.innerHTML = "";

  if (snapshot.exists()) {
    snapshot.forEach(function (childSnapshot) {
      const expense = childSnapshot.val();
      expense.id = childSnapshot.key; // ✅ store Firebase key for deletion
      expenses.push(expense);
    });
  }

  updateTotalExpensesAmount();
  calculateAndUpdateAmountOwed();
});

// -------------------------------------------------------
// LISTEN TO FIREBASE - TRAVELERS (real-time sync)
// -------------------------------------------------------
onValue(travelersRef, function (snapshot) {
  travelers = [];
  travelersList.innerHTML = "";

  if (snapshot.exists()) {
    snapshot.forEach(function (childSnapshot) {
      const traveler = childSnapshot.val();
      traveler.id = childSnapshot.key; // ✅ store Firebase key for deletion
      travelers.push(traveler);
    });
  }

  calculateAndUpdateAmountOwed();
});

// -------------------------------------------------------
// DISPLAY FUNCTIONS
// -------------------------------------------------------

// Update total expenses amount shown on page
function updateTotalExpensesAmount() {
  const totalExpense = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  totalExpensesAmountElement.textContent = "$" + totalExpense;
}

// Calculate how much each traveler owes and refresh lists
function calculateAndUpdateAmountOwed() {
  const totalExpense = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const amountPerTraveler = travelers.length > 0
    ? (totalExpense / travelers.length).toFixed(2)
    : 0;

  // Refresh expense list
  expenseList.innerHTML = "";
  expenses.forEach(function (expense) {
    addExpenseToList(expense);
  });

  // Refresh travelers list with updated amounts
  travelersList.innerHTML = "";
  travelers.forEach(function (traveler) {
    traveler.amountOwed = amountPerTraveler;
    addTravelerToList(traveler);
  });
}

// Add a single expense item to the UI
function addExpenseToList(expense) {
  const expenseItem = document.createElement("li");
  expenseItem.textContent = expense.category + ": $" + expense.amount;
  const deleteBtn = createDeleteButton(function () {
    deleteExpense(expense.id); // ✅ delete from Firebase using key
  });
  expenseItem.appendChild(deleteBtn);
  expenseList.appendChild(expenseItem);
}

// Add a single traveler to the UI
function addTravelerToList(traveler) {
  const travelerItem = document.createElement("div");
  travelerItem.classList.add("traveler-item");
  travelerItem.textContent = traveler.name + ": $" + traveler.amountOwed;
  const removeBtn = createDeleteButton(function () {
    removeTraveler(traveler.id); // ✅ delete from Firebase using key
  });
  travelerItem.appendChild(removeBtn);
  travelersList.appendChild(travelerItem);
}

// -------------------------------------------------------
// DELETE FUNCTIONS - removes from Firebase
// -------------------------------------------------------

function deleteExpense(id) {
  const expenseToDelete = ref(database, "expenses/" + id);
  remove(expenseToDelete);
}

function removeTraveler(id) {
  const travelerToDelete = ref(database, "travelers/" + id);
  remove(travelerToDelete);
}

// -------------------------------------------------------
// HELPER - Create a trash icon delete button
// -------------------------------------------------------
function createDeleteButton(deleteFunction) {
  const button = document.createElement("button");
  button.innerHTML = "<i class='fas fa-trash-alt'></i>";
  button.addEventListener("click", deleteFunction);
  return button;
}