let db;
// create new db request for budget db
const request = indexedDB.open("budget", 1);

request.onupgradeneeded = function (event) {
    // create object called pending
    const db = event.target.result;
    db.createObjectStore("pending", { autoIncrement: true });
};

request.onsuccess = function (event) {
    db = event.target.result;
    // check if app is online before reading from db
    if (navigator.onLine) {
        checkDatabase();
    }
};

request.onerror = function (event) {
    console.log("Woops! " + event.target.errorCode);
};

function saveRecord(record) {
    // create transaction on pending db
    const transaction = db.transaction(["pending"], "readwrite");

    // access pending object
    const store = transaction.objectStore("pending");

    // add record to pending object
    store.add(record);
}

function checkDatabase() {
    // open a transaction on pending db
    const transaction = db.transaction(["pending"], "readwrite");
    // access pending object store
    const store = transaction.objectStore("pending");
    // get all records from pending object store and set to getAll
    const getAll = store.getAll();

    getAll.onsuccess = function () {
        if (getAll.result.length > 0) {
            fetch("/api/transaction/bulk", {
                method: "POST",
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: "application/json, text/plain, */*",
                    "Content-Type": "application/json"
                }
            })
                .then(response => response.json())
                .then(() => {
                    // if successful, open a transaction on your pending db
                    const transaction = db.transaction(["pending"], "readwrite");
                    // access pending object store
                    const store = transaction.objectStore("pending");
                    // clear all items in pending object store store
                    store.clear();
                });
        }
    };
}

// app coming back online
window.addEventListener("online", checkDatabase);