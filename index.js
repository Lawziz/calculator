const display = document.getElementById("display");
const historyList = []; 

function appendToDisplay(input) {
    const operators = ["+", "-", "*", "/"];
    const lastChar = display.value.slice(-1);

    // Prevent "00" at the start or after an operator
if (input === "00" && (display.value === "" || operators.includes(lastChar))) {
    display.value += "0"; // Just add a single zero instead
    scaleFont();
    return;
}

if (input === ".") {
    const parts = display.value.split(/[+\-*/]/); // Split by operators to get the current number
    const currentNumber = parts[parts.length - 1];
    if (currentNumber.includes(".")) return; // Block if decimal already exists
}
    // 1. If we just finished a calculation and a number is pressed, reset the screen
    if (isNewCalculation && !isNaN(input)) {
        display.value = input;
        isNewCalculation = false;
        scaleFont();
        return; // STOP HERE
    }

    // 2. Clear the "isNewCalculation" flag if an operator is pressed 
    // (This allows you to do "10 + 5 = 15" then hit "+" to get "15 +")
    if (isNewCalculation && operators.includes(input)) {
        isNewCalculation = false;
    }

    // 3. Prevent starting with *, /, or +
    if (display.value === "" && ["+", "*", "/"].includes(input)) return;

    // 4. THE OPERATOR GUARD
    if (operators.includes(input)) {
        if (operators.includes(lastChar)) {
            // Check for negative number exception (5 * -)
            if (input === "-" && (lastChar === "*" || lastChar === "/")) {
                // Allow it to fall through and append
            } else if (lastChar === "-" && display.value.length >= 2 && ["*", "/"].includes(display.value.slice(-2, -1))) {
                // Replace both operators (*-) with the new operator
                display.value = display.value.slice(0, -2) + input;
                scaleFont();
                return;
            } else if (lastChar === "-" && input !== "-") {
                // Don't allow replacing minus with another operator (prevents 5*-* from becoming 5**)
                // Just ignore the input
                scaleFont();
                return;
            } else {
                // SWAP the operator and STOP
                display.value = display.value.slice(0, -1) + input;
                scaleFont();
                return; 
            }
        }
    }

    // 5. Normal Append
    display.value += input;
    scaleFont();
}
function scaleFont(){   
    const len = display.value.length;
    display.classList.toggle("font-small", len > 12);
    display.classList.toggle("font-medium", len > 8 && len <= 12); 
}

// Keep this at the top of your index.js
let isNewCalculation = false; // Flag to track if the next input should start a new calculation

function calculate() {
    try {
        if (display.value === "" || display.value === "Error") return;

        const expression = display.value.replace(/[^0-9+\-*/.]/g, '');
        let result = eval(expression);
        if (result === Infinity || isNaN(result)) {
            display.value = "Error";
            isNewCalculation = true; // Allow user to start over immediately
            return; // Exit the function so it doesn't try to format 'Infinity'
        }
        let finalNum = Number(result.toPrecision(12));

        if (Math.abs(finalNum) >= 1e12 || (Math.abs(finalNum) <= 1e-7 && finalNum !== 0)) {
            let expStr = finalNum.toExponential(7);
            let [mantissa, exponent] = expStr.split('e');
            mantissa = mantissa.replace(/(\.\d*?)0+$/, '$1'); // Remove trailing zeros
            if (mantissa.endsWith('.')) mantissa = mantissa.slice(0, -1); // Remove trailing dot
            exponent = exponent.replace(/^\+/, ''); // Remove + sign
            display.value = mantissa + 'e' + exponent;
        } else {
            display.value = finalNum;
        }

        // --- NEW: Update the History Array & HTML ---
        historyList.unshift(`${expression} = ${display.value}`);
        if (historyList.length > 5) historyList.pop();

        renderHistory(); // Call the helper function below
        scaleFont();
        
    } catch (error) {
        display.value = "Error";
    }
    isNewCalculation = true;  // Set the flag to start a new calculation on next input   
 }

// Helper function to draw the list on the screen
function renderHistory() {
    const listElement = document.getElementById("history-display");
    listElement.innerHTML = ""; 

    historyList.slice(0, 3).forEach(entry => {
        const li = document.createElement("li");
        li.textContent = entry;
        li.style.cursor = "pointer";
        
        // Let the user tap a history item to put the result back in the display
        li.onclick = () => {
            const resultOnly = entry.split(" = ")[1];
            display.value = resultOnly;
            scaleFont();
        };
        
        listElement.appendChild(li);
    });
}


function clearOneDisplay(){
    display.value = display.value.slice(0, -1);
    scaleFont(); 
}

function clearAllDisplay(){
    display.value = "";
    scaleFont();
}

function percentDisplay(){
    if (display.value !== ""){
        let result = parseFloat(display.value) / 100;
        display.value = Number(result.toPrecision(12));
        scaleFont();
    }
}

// --- KEYBOARD SUPPORT ---
window.addEventListener("keydown", (e) => {
    // Prevent default browser behavior (like scrolling with space)
    if (["+", "-", "*", "/", "Enter", "Backspace", "%"].includes(e.key)) {
        e.preventDefault();
    }

    if (!isNaN(e.key) || "+-*/.".includes(e.key)) appendToDisplay(e.key);
    if (e.key === "Enter" || e.key === "=") calculate();
    if (e.key === "Backspace") clearOneDisplay();
    if (e.key === "Escape") clearAllDisplay();
    if (e.key === "%") percentDisplay();
  
});
// This loop ensures every button gets the haptic effect
document.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('touchstart', (e) => {
        // 1. Visual feedback
        btn.classList.add('pressed');
        
        // 2. Haptic feedback (10ms is a sharp, light tap)
        if ('vibrate' in navigator) {
            navigator.vibrate(10);
        }
    }, { passive: true });

    btn.addEventListener('touchend', () => {
        btn.classList.remove('pressed');
    }, { passive: true });
});
