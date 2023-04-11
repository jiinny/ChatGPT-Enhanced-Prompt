let _container;
let _input;
let _currentTextArea;
let _messageHistoryElement;
// Create an array to store the message history
let _messageHistoryArray = [];
let _textAreaListListenerSet = [];
let _savedColorMode;
let _selectButton;
let _submitButton;

// Add an event listener to detect changes in dark mode state
const htmlElement = document.querySelector('html');

// Create MutationObserver
const observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
        if (mutation.attributeName === 'class') {
            const currentValue = mutation.target.getAttribute('class');
            if (currentValue != _savedColorMode) {
                _savedColorMode = currentValue;
                updateColorMode();
            }
        }
    });
});

// MutationObserver를 시작합니다.
observer.observe(htmlElement, { attributes: true });

function updateColorMode() {
    // Set the custom input field's background and text color to match the ChatGPT input field
    _input.style.backgroundColor = window.getComputedStyle(_currentTextArea).backgroundColor;
    _input.style.color = window.getComputedStyle(_currentTextArea).color;
    _messageHistoryElement.style.backgroundColor = window.getComputedStyle(_currentTextArea.parentElement).backgroundColor;
    _messageHistoryElement.style.color = window.getComputedStyle(_currentTextArea.parentElement).color;
    // for each child of message history  element
    for (let i = 0; i < _messageHistoryElement.children.length; i++) {
        const child = _messageHistoryElement.children[i];
        const messageDiv = child.querySelector('.message-history-item');
        messageDiv.style.backgroundColor = window.getComputedStyle(_currentTextArea.parentElement).backgroundColor;
        messageDiv.style.color = window.getComputedStyle(_currentTextArea.parentElement).color;
    }
}


// wait for the textarea to be added to the DOM
waitForElement('textarea[data-id]', initCustomInputField);
waitForElement('form', initFormListener);


function initFormListener(form) {
    form.addEventListener('submit', function (event) {
        appendCustomInputToTextarea();
    });
}

function initCustomInputField(textarea) {
    if (_currentTextArea === textarea) {
        return;
    }

    _submitButton = document.querySelector('button.absolute.p-1');

    _currentTextArea = textarea;
    

    if (!_container) {
        // Create a container element for the custom input field and history dropdown
        _container = document.createElement('div');
        _container.classList.add('custom-input-container');

        // Create the custom input field
        _input = document.createElement('input');
        _input.setAttribute('type', 'text');
        _input.setAttribute('placeholder', 'Appeding message...');
        _input.classList.add('input-field');
        _container.appendChild(_input);

        _selectButton = document.createElement('div');
        const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18">
    <path d="M7 10l5 5 5-5z"/>
  </svg>
`;

        _selectButton.classList.add('selecting');
        _selectButton.innerHTML = svg.trim();
        const icon = _selectButton.firstChild;
        icon.setAttribute('class', 'selecting-icon');

        _selectButton.setAttribute('title', 'Selecting');
        _selectButton.setAttribute('tabindex', '0');
        _container.appendChild(_selectButton);

        // set listener for _selectButton
        _selectButton.addEventListener('click', () => {
            toggleMessageHistoryList();
        });

        _selectButton.addEventListener('keydown', (event) => {
            messageHistoryAssociatedKeyDown(_selectButton, event);
        });

        
        // Create a div for message history list instead of a dropdown box
        _messageHistoryElement = document.createElement('div');
        _messageHistoryElement.classList.add('message-history-list');
        _messageHistoryElement.style.backgroundColor = window.getComputedStyle(textarea.parentElement).backgroundColor;
        _messageHistoryElement.style.color = window.getComputedStyle(textarea.parentElement).color;
        _container.appendChild(_messageHistoryElement);

        //Hide the message history list initially
        _messageHistoryElement.style.display = 'none';

        // Show the message history list when the input is focused
        _input.addEventListener('focus', () => {
            _messageHistoryElement.style.display = 'block';
            _selectButton.selected = true;
            _selectButton.classList.add('selected');
        });

        // Show the message history list when the input is clicked
        // _input.addEventListener('click', () => {
        //     _messageHistoryElement.style.display = 'block';
        // });

        // Hide the message history list when input field loses focus
        // _messageHistoryElement.addEventListener('blur', () => {
        //     setTimeout(() => {
        //         _messageHistoryElement.style.display = 'none';
        //     }, 100);
        // });

        _input.addEventListener('keydown', (event) => {
            messageHistoryAssociatedKeyDown(_input, event);
        });

        // add message to history list when the input field loses focus
        // _input.addEventListener('blur', () => {
        //     addMessageToHistoryList(_input.value);
        // });


        observeTextareaValue(textarea);
        readJsonFile().then((data) => {
            _messageHistoryArray = data;
            renderMessageHistory();
            //set last used message as selected among child of message history list
            if (_input.value !== '' && _input.value !== null && _input.value !== undefined) {
                // for each child of message history  element
                for (let i = 0; i < _messageHistoryElement.children.length; i++) {
                    const messageWrapper = _messageHistoryElement.children[i];
                    const messageDiv = messageWrapper.querySelector('.message-history-item');
                    if (messageDiv.innerText === _input.value) {
                        setSelectedItem(messageDiv);
                        break;
                    }
                }
            }
        });
    }
    
    // Set the custom input field's background and text color to match the ChatGPT input field
    _input.style.backgroundColor = window.getComputedStyle(textarea).backgroundColor;
    _input.style.color = window.getComputedStyle(textarea).color;

    function prependInputField() {
        const newTextarea = document.querySelector('textarea[data-id]');
        if (newTextarea) {
            setCurrentListener(newTextarea);
            const parentElement = newTextarea.parentElement;
            if (parentElement && !parentElement.contains(_container)) {
                parentElement.prepend(_container);
            }
        }
    }

    // Set current textarea and set listener
    function setCurrentListener(newTextarea) {
        _currentTextArea = newTextarea;
        if (_textAreaListListenerSet.indexOf(_currentTextArea) == -1) {
            _textAreaListListenerSet.push(_currentTextArea);
            _currentTextArea.addEventListener('focus', () => {
                closeMessageHistoryList()
            });

            _currentTextArea.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' && !event.shiftKey && !event.customEvent) {
                    appendCustomInputToTextarea();
                }
            });
        }
    }


    // Prepend the custom input field to the ChatGPT input field
    // When 'New chat' page is the first dialog for opening the website, obsever is not working
    // So, call prependInputField() function to prepend the custom input field
    //prependInputField();

    // Call this function again whenever the textarea is removed and re-added to the DOM
    const observer = new MutationObserver((mutations, observer) => {
        prependInputField();
    });
    
    observer.observe(document.body, { childList: true, subtree: true });

    // Add an event listener to the document body to append the custom input field's value to the ChatGPT input field
    _submitButton.addEventListener('click', (event) => {
        appendCustomInputToTextarea();
    });

    //document.head.appendChild(style);

    function appendCustomInputToTextarea() {
        //console.log("appendCustomInputToTextarea")
        const message = _input.value.trim();
        if (message) {
            //console.log("message", message)

            if (addMessageToHistoryList(message)) {
                writeJsonFile(_messageHistoryArray, message);
            }

            // Set the textarea value to the message
            fullMessage = _currentTextArea.value + '\n\n' + message;
            _currentTextArea.value = fullMessage; 
            //console.log("textarea.value", _currentTextArea.value)
        }
    }
    readJsonFile();
}

function waitForElement(selector, callback) {
    const element = document.querySelector(selector);
    if (element) {
        callback(element);
    } else {
        const observer = new MutationObserver((mutations, observer) => {
            const element = document.querySelector(selector);
            if (element) {
                callback(element);
                observer.disconnect();
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }
}

let lastTextareaValue = '';

function observeTextareaValue(textarea) {
    textarea.addEventListener('input', () => {
        lastTextareaValue = textarea.value;
    });
}
async function readJsonFile() {
    try {
        const result = await new Promise((resolve) => {
            chrome.storage.local.get("appended_data", (result) => {
                resolve(result.appended_data || []);
            });
        });
        try {
            const parsedData = JSON.parse(result);
            if (parsedData.lastUsedMessage) {
                _input.value = parsedData.lastUsedMessage;
            }
            return parsedData.messageHistory || [];
        } catch (error) {
            //console.error(error);
            return [];
        }
    } catch (error) {
        console.error("Error reading JSON file:", error);
        return [];
    }
}


async function writeJsonFile(data, lastUsedMessage) {
    try {
        const json = JSON.stringify({ messageHistory: data, lastUsedMessage: lastUsedMessage });
        await new Promise((resolve) => {
            chrome.storage.local.set({ appended_data: json }, resolve);
        });
    } catch (error) {
        console.error("Error writing JSON file:", error);
    }
}

// add message to history list
function addMessageToHistoryList(message) {
    if (message == null || message == undefined || message == "") {
        return false;
    }

    const trimedMessage = message.trim();
    if (!_messageHistoryArray.includes(trimedMessage)) {
        _messageHistoryArray.push(trimedMessage);
        const messageDiv = createMessageDiv(trimedMessage);
        _messageHistoryElement.appendChild(messageDiv);
        _messageHistoryElement.scrollTo(0, _messageHistoryElement.scrollHeight)
        //console.log(_messageHistoryElement.scrollHeight);
        writeJsonFile(_messageHistoryArray, trimedMessage);
        return true;
    }
    else{
        // set message div style selected
        const index = _messageHistoryArray.indexOf(trimedMessage);
        if (index == -1) {
            return false;
        }
        const messageWrapper = _messageHistoryElement.children[index];
        const messageDiv = messageWrapper.children[0];
        setSelectedItem(messageDiv);
    }
    return false;
}

// create message div
function createMessageDiv(message) {
    const messageWrapper = document.createElement('div');
    messageWrapper.classList.add('message-wrapper');

    const messageDiv = document.createElement('div');
    messageDiv.textContent = message;
    messageDiv.classList.add('message-history-item');
    messageDiv.style.backgroundColor = window.getComputedStyle(_currentTextArea).backgroundColor;
    messageDiv.style.color = window.getComputedStyle(_currentTextArea).color;
    messageDiv.addEventListener('click', (event) => {
        event.stopPropagation();
        const selectedItem = event.target;
        setSelectedItem(selectedItem);
        applyBlinkEffect(selectedItem);

        const selectedMessage = selectedItem.textContent;
        _input.value = selectedMessage;
        setTimeout(() => {
            _messageHistoryElement.style.display = 'none';
        }, 100);
        _input.focus();
        sendMouseClickEvent(_selectButton);
    });

    const deleteButton = document.createElement('button');
    const svgNS = "http://www.w3.org/2000/svg";
    const deleteIcon = document.createElementNS(svgNS, "svg");
    const line1 = document.createElementNS(svgNS, "line");
    line1.setAttribute("x1", "4");
    line1.setAttribute("y1", "4");
    line1.setAttribute("x2", "14");
    line1.setAttribute("y2", "14");
    line1.setAttribute("stroke", "white");
    line1.setAttribute("stroke-width", "2");

    const line2 = document.createElementNS(svgNS, "line");
    line2.setAttribute("x1", "4");
    line2.setAttribute("y1", "14");
    line2.setAttribute("x2", "14");
    line2.setAttribute("y2", "4");
    line2.setAttribute("stroke", "white");
    line2.setAttribute("stroke-width", "2");

    deleteIcon.appendChild(line1);
    deleteIcon.appendChild(line2);
    
    deleteIcon.setAttribute("width", "18");
    deleteIcon.setAttribute("height", "18");
    deleteIcon.setAttribute("viewBox", "0 0 18 18");
    deleteIcon.setAttribute("fill", "none");
    deleteIcon.setAttribute("xmlns", svgNS);
    
    deleteButton.appendChild(deleteIcon);
    deleteButton.classList.add('delete-button');
    deleteButton.title = 'Delete';
    deleteButton.addEventListener('click', (event) => {
        event.stopPropagation();
        const index = _messageHistoryArray.indexOf(message);
        if (index > -1) {
            deleteMessageFromHistory(index);
        }
        messageDiv.remove();
    });
    deleteButton.setAttribute('tabindex', '-1');

    messageWrapper.appendChild(messageDiv);
    messageWrapper.appendChild(deleteButton);

    return messageWrapper;
}

// Delete the message from the history array
function deleteMessageFromHistory(index) {
    _messageHistoryArray.splice(index, 1);

    const message = _input.value.trim();
    if (message) {
        writeJsonFile(_messageHistoryArray, message);
    }
    else{
        writeJsonFile(_messageHistoryArray, '');
    }
    renderMessageHistory();
}

function renderMessageHistory() {
    _messageHistoryElement.innerHTML = '';

    //console.log(_messageHistoryArray);
    _messageHistoryArray.forEach((message) => {
        const messageDiv = createMessageDiv(message);
        _messageHistoryElement.appendChild(messageDiv);
    });
}

function setSelectedItem(item) {
    // Deselect the previously selected item
    const selectedItem = _messageHistoryElement.querySelector('.message-history-item.selected');
    if (selectedItem && selectedItem !== item) {
        selectedItem.classList.remove('selected');
    }

    // Set the selected class to the current item
    item.classList.add('selected');
}

function applyBlinkEffect(item) {
    item.classList.add('blink');
    setTimeout(() => {
        item.classList.remove('blink');
    }, 500);
}

function sendMouseClickEvent(element) {
    const event = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true
    });
    element.dispatchEvent(event);
}

function closeMessageHistoryList() {
    if (_messageHistoryElement.style.display == 'block') {
        setTimeout(() => {
            _messageHistoryElement.style.display = 'none';
        }, 100);
        if (_selectButton.selected) {
            _selectButton.selected = false;
            _selectButton.classList.remove('selected');
            return true;
        }
    }
    return false;
}

//toggle message history list
function toggleMessageHistoryList() {
    if (_messageHistoryElement.style.display == 'none') {
        _messageHistoryElement.style.display = 'block';
        _messageHistoryElement.scrollTo(0, _messageHistoryElement.scrollHeight)
        _input.focus();
        // set select button style selected
        _selectButton.selected = true;
        _selectButton.classList.add('selected');
    } else {
        _messageHistoryElement.style.display = 'none';

        // set select button style unselected
        _selectButton.selected = false;
        _selectButton.classList.remove('selected');
    }
}

// event handler for keydown event on the input or select history container
function messageHistoryAssociatedKeyDown(element, event) {
    newSelected = null;
    switch (event.key) {
        case 'Enter':
            addMessageToHistoryList(_input.value);
            event.preventDefault();
            element == _selectButton ? sendMouseClickEvent(_selectButton) : _currentTextArea.focus();
            break;
        case 'Tab':
            closeMessageHistoryList();
            if (element == _input) {
                _input.value = _input.value.trim();
                _currentTextArea.focus();
                event.preventDefault();
            }
            break;
        case 'ArrowUp':
            event.preventDefault();
            if (_selectButton.selected) {
                const selected = _messageHistoryElement.querySelector('.selected');
                if (selected) {
                    const previous = selected.parentElement.previousElementSibling;
                    if (previous) {
                        newSelected = previous.querySelector('.message-history-item');
                    }
                    else {
                        newSelected = selected.parentElement.parentElement.lastElementChild.firstElementChild;
                    }
                }
                else {
                    const last = _messageHistoryElement.lastElementChild;
                    if (last) {
                        newSelected = last.querySelector('.message-history-item');
                    }
                }
            }
            else {
                sendMouseClickEvent(_selectButton);
            }
            break;
        case 'ArrowDown':
            event.preventDefault();
            if (_selectButton.selected) {
                const selected = _messageHistoryElement.querySelector('.selected');
                if (selected) {
                    const next = selected.parentElement.nextElementSibling;
                    if (next) {
                        newSelected = next.querySelector('.message-history-item');
                    }
                    else {
                        newSelected = selected.parentElement.parentElement.firstElementChild.firstElementChild;
                    }
                }
                else {
                    const first = _messageHistoryElement.firstElementChild;
                    if (first) {
                        newSelected = first.querySelector('.message-history-item');
                    }
                }
            } else {
                sendMouseClickEvent(_selectButton);
            }
            break;
        case 'Escape':
            event.preventDefault();
            historyOpend = closeMessageHistoryList();
            if (element == _input && historyOpend == false){
                _input.value = _input.value.trim();
                _currentTextArea.focus();
            }
            break;
    }

    if (newSelected) {
        setSelectedItem(newSelected);
        _input.value = newSelected.innerText;
    }
}
