// Global variables
let currentValue = 0;
let rowCount = 1;
let currentDate; // Define global variable
let previousTotalDistance = 0; // Variable to keep track of the previous total distance
let previousHomeDistance = 0; // Variable to keep track of the previous home distance
let previousRowDate = null; // Variable to keep track of the previous row date

window.addEventListener('load', function() {
    const fadeElements = document.querySelectorAll('.fade-in');
    fadeElements.forEach((el, index) => {
        setTimeout(() => {
            el.classList.add('visible');
        }, index * 200); // Stagger the animations with a delay
    });

    // Initialize currentDate
    currentDate = getFirstDayOfCurrentMonth();

    // Trigger addRow on Enter key press
    document.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault(); // Prevent default action of Enter key (e.g., form submission)
            addRow();
        }
    });

    // Prevent right-click context menu
    document.addEventListener('contextmenu', function(event) {
        event.preventDefault();
    });

    // Add event listener to date input field
    document.getElementById('startDate').addEventListener('change', function() {
        document.getElementById('odometer').value = ''; // Clear odometer value
        document.getElementById('travelDistance').value = '';
        document.getElementById('odometer').disabled = false; // Enable odometer field
        alert("Update odometer value also");
    });
});

function getFirstDayOfCurrentMonth() {
    let now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
}

function formatter(date) {
    let day = String(date.getDate()).padStart(2, '0');
    let month = String(date.getMonth() + 1).padStart(2, '0');
    let year = date.getFullYear();

    return `${day}-${month}-${year}`;
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function addRow() {
    let odometer = parseInt(document.getElementById("odometer").value) || 0;
    let travelDistance = parseInt(document.getElementById("travelDistance").value) || 0;
    let homeDistance = parseInt(document.getElementById("homeDistance").value) || 0;
    let dateInput = document.getElementById("startDate").value; // Get the date input value

    // Validate input values
    if (travelDistance === 0) {
        alert("Check Travel Distance");
        return;
    }
    if (homeDistance === 0) {
        alert("Check Home Distance");
        return;
    }

    // Check if a new date has been provided
    if (dateInput) {
        let newDate = new Date(dateInput);
        if (newDate > currentDate) {
            currentDate = newDate; // Update the current date to the new date
            previousTotalDistance = odometer;
            previousTotalDistance = previousTotalDistance - previousHomeDistance;
        }
        document.getElementById("odometer").disabled = false; // Enable odometer field
    }
    let randomHomeDistance = getRandomInt(1, homeDistance);
    let formattedDate = formatter(currentDate);

    let table = document.getElementById("dynamicTable").getElementsByTagName('tbody')[0];
    let row = table.insertRow();

    let cell1 = row.insertCell(0);
    let cell2 = row.insertCell(1);
    let cell3 = row.insertCell(2);
    let cell4 = row.insertCell(3);
    let cell5 = row.insertCell(4);

    cell1.innerHTML = formattedDate;
    cell2.innerHTML = travelDistance;
    cell5.innerHTML = randomHomeDistance;
    if(previousRowDate){
        currentDate = new Date(previousRowDate.split('-').reverse().join('-'));
        currentDate.setDate(currentDate.getDate() + 1); // Start from the next day
        cell1.innerHTML = currentDate;
    }

    let initialReading;
    if (rowCount === 1) {
        initialReading = odometer;
    } else {
        initialReading = previousTotalDistance + previousHomeDistance;
    }

    cell3.innerHTML = initialReading;

    let totalDistance = travelDistance + initialReading;
    cell4.innerHTML = totalDistance;

    // Update global variables
    currentValue += travelDistance + randomHomeDistance;
    previousHomeDistance = randomHomeDistance; // Store the last random home distance
    previousTotalDistance = totalDistance;
    currentDate.setDate(currentDate.getDate() + 1);
    document.getElementById("travelDistance").value = "";
    rowCount++;
}


function removeLastRow() {
    let table = document.getElementById("dynamicTable").getElementsByTagName('tbody')[0];
    let rowCount = table.rows.length;

    if (rowCount > 0) {
        let lastRow = table.rows[rowCount - 1];
        let lastTravelDistance = parseInt(lastRow.cells[1].innerHTML);
        let lastRandomHomeDistance = parseInt(lastRow.cells[4].innerHTML);

        previousTotalDistance -= lastTravelDistance;
        currentValue -= (lastTravelDistance + lastRandomHomeDistance);
        previousRowDate = lastRow.cells[0].innerHTML;
        table.deleteRow(rowCount - 1);
        rowCount--;

        if (rowCount === 0) {
            document.getElementById("odometer").disabled = false;
            previousTotalDistance = 0;
            previousHomeDistance = 0;
            currentValue = 0;
            previousRowDate = null; 
        } else {
            let newLastRow = table.rows[rowCount - 1];
            previousTotalDistance = parseInt(newLastRow.cells[3].innerHTML);
            previousHomeDistance = parseInt(newLastRow.cells[4].innerHTML);
            previousRowDate = newLastRow.cells[0].innerHTML; // Update previousRowDate
        }
    } else {
        alert("No rows to remove.");
    }
}

function finishTable() {
    alert("Table generation finished!");
    document.getElementById("travelDistance").disabled = true;
    document.querySelector("button[onclick='addRow()']").disabled = true;
    document.querySelector("button[onclick='removeLastRow()']").disabled = true;
    document.getElementById("odometer").disabled = true;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
    });

    const marginLeft = 10;
    const marginTop = 20;
    const rowHeight = 10;
    const pageHeight = doc.internal.pageSize.height;

    let table = document.getElementById("dynamicTable");
    let rows = table.querySelectorAll("tbody tr");

    let colWidths = [40, 60, 60, 60, 60];

    let y = marginTop;
    let initialOdometer = parseInt(document.getElementById("odometer").value) || 0;

    // Function to add headers
    function addHeaders() {
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Date", marginLeft, y);
        doc.text("Travel Distance", marginLeft + colWidths[0], y);
        doc.text("Initial Reading", marginLeft + colWidths[0] + colWidths[1], y);
        doc.text("Total Distance", marginLeft + colWidths[0] + colWidths[1] + colWidths[2], y);
        doc.text("Home Distance", marginLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], y);
        y += rowHeight;
    }

    // Function to add rows
    function addRows() {
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");

        rows.forEach(row => {
            if (y + rowHeight > pageHeight) {
                doc.addPage();
                y = marginTop;
                addHeaders();
            }

            let cells = row.querySelectorAll("td");
            cells.forEach((cell, index) => {
                doc.text(cell.innerText, marginLeft + colWidths.slice(0, index).reduce((a, b) => a + b, 0), y);
            });

            y += rowHeight;
        });
    }

    addHeaders();
    addRows();
    let fileName = "Pathra " + new Date().toISOString().split('T')[0] + ".pdf";
    doc.save(fileName);
}
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('/sw.js').then(function(registration) {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      }, function(error) {
        console.log('ServiceWorker registration failed: ', error);
      });
    });
  }
