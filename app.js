// REST API Client Application
class RestApiClient {
    constructor() {
        this.currentRequest = {
            method: 'GET',
            url: '',
            headers: [],
            params: [],
            auth: { type: 'none' },
            body: '',
            bodyType: 'json'
        };
        
        this.environments = [];
        this.currentEnvIndex = 0;
        this.savedRequests = [];
        this.requestHistory = [];
        this.isDarkMode = true;
        this.lastResponse = null;
        
        // Sample data from requirements
        this.sampleData = {
            requests: [
                {
                    name: "Get Posts",
                    method: "GET",
                    url: "https://jsonplaceholder.typicode.com/posts",
                    headers: [{"key": "Content-Type", "value": "application/json"}],
                    body: ""
                },
                {
                    name: "Test HTTP Methods",
                    method: "GET",
                    url: "https://httpbin.org/get",
                    headers: [{"key": "User-Agent", "value": "REST-Client/1.0"}],
                    body: ""
                },
                {
                    name: "Get Users",
                    method: "GET",
                    url: "https://reqres.in/api/users",
                    headers: [{"key": "Accept", "value": "application/json"}],
                    body: ""
                },
                {
                    name: "Create Post",
                    method: "POST",
                    url: "https://jsonplaceholder.typicode.com/posts",
                    headers: [{"key": "Content-Type", "value": "application/json"}],
                    body: '{\n  "title": "Sample Post",\n  "body": "This is a sample post body",\n  "userId": 1\n}'
                }
            ],
            environments: [
                {"name": "Development", "baseUrl": "https://api-dev.example.com"},
                {"name": "Staging", "baseUrl": "https://api-staging.example.com"},
                {"name": "Production", "baseUrl": "https://api.example.com"}
            ]
        };
        
        this.init();
    }
    
    init() {
        this.loadFromStorage();
        this.setupEventListeners();
        this.updateUI();
        this.addEmptyKVPairs();
        
        // Set theme
        document.documentElement.setAttribute('data-color-scheme', this.isDarkMode ? 'dark' : 'light');
        this.updateThemeToggle();
    }
    
    setupEventListeners() {
        // Sidebar toggle (mobile)
        const sidebarToggle = document.getElementById('sidebar-toggle');
        const sidebar = document.getElementById('sidebar');
        sidebarToggle?.addEventListener('click', () => this.toggleSidebar());
        
        // Theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        themeToggle?.addEventListener('click', () => this.toggleTheme());
        
        // Request controls
        const methodSelect = document.getElementById('method-select');
        const urlInput = document.getElementById('url-input');
        const sendBtn = document.getElementById('send-btn');
        const saveBtn = document.getElementById('save-btn');
        
        methodSelect?.addEventListener('change', (e) => {
            this.currentRequest.method = e.target.value;
        });
        
        urlInput?.addEventListener('input', (e) => {
            this.currentRequest.url = e.target.value;
        });
        
        sendBtn?.addEventListener('click', () => this.sendRequest());
        saveBtn?.addEventListener('click', () => this.showSaveModal());
        
        // Keyboard shortcut for send (Ctrl/Cmd + Enter)
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                this.sendRequest();
            }
        });
        
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tabName = btn.dataset.tab;
                this.switchTab(tabName);
            });
        });
        
        // Response tabs
        document.querySelectorAll('.response-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tabName = btn.dataset.tab;
                this.switchResponseTab(tabName);
            });
        });
        
        // Add buttons
        document.getElementById('add-header-btn')?.addEventListener('click', () => this.addKVPair('headers'));
        document.getElementById('add-param-btn')?.addEventListener('click', () => this.addKVPair('params'));
        document.getElementById('add-form-field-btn')?.addEventListener('click', () => this.addKVPair('form'));
        
        // Auth type change
        const authType = document.getElementById('auth-type');
        authType?.addEventListener('change', () => this.updateAuthFields());
        
        // Body type change
        document.querySelectorAll('input[name="body-type"]').forEach(radio => {
            radio.addEventListener('change', () => this.updateBodyType());
        });
        
        // Format JSON button
        document.getElementById('format-json-btn')?.addEventListener('click', () => this.formatJSON());
        
        // Response actions
        document.getElementById('copy-response-btn')?.addEventListener('click', () => this.copyResponse());
        document.getElementById('clear-response-btn')?.addEventListener('click', () => this.clearResponse());
        
        // Environment management
        document.getElementById('environment-select')?.addEventListener('change', (e) => {
            this.currentEnvIndex = parseInt(e.target.value);
            this.saveToStorage();
        });
        
        document.getElementById('manage-env-btn')?.addEventListener('click', () => this.showEnvModal());
        document.getElementById('add-env-btn')?.addEventListener('click', () => this.addEnvironment());
        document.getElementById('close-env-modal-btn')?.addEventListener('click', () => this.hideEnvModal());
        
        // History and saved requests
        document.getElementById('import-sample-btn')?.addEventListener('click', () => this.importSampleRequests());
        document.getElementById('clear-history-btn')?.addEventListener('click', () => this.clearHistory());
        
        // Save modal
        document.getElementById('cancel-save-btn')?.addEventListener('click', () => this.hideSaveModal());
        document.getElementById('confirm-save-btn')?.addEventListener('click', () => this.saveRequest());
        
        // Close modals on backdrop click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });
    }
    
    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const toggle = document.getElementById('sidebar-toggle');
        
        sidebar.classList.toggle('open');
        toggle.classList.toggle('active');
        
        // Add overlay for mobile
        let overlay = document.querySelector('.sidebar-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'sidebar-overlay';
            document.body.appendChild(overlay);
            overlay.addEventListener('click', () => this.toggleSidebar());
        }
        
        overlay.classList.toggle('active', sidebar.classList.contains('open'));
    }
    
    toggleTheme() {
        this.isDarkMode = !this.isDarkMode;
        document.documentElement.setAttribute('data-color-scheme', this.isDarkMode ? 'dark' : 'light');
        this.updateThemeToggle();
        this.saveToStorage();
    }
    
    updateThemeToggle() {
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.textContent = this.isDarkMode ? '☀️ Light' : '🌙 Dark';
        }
    }
    
    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        
        // Update tab panels
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === `${tabName}-tab`);
        });
    }
    
    switchResponseTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.response-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        
        // Update tab panels
        document.querySelectorAll('.response-tab-panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === `${tabName}-tab`);
        });
    }
    
    addKVPair(type) {
        const containers = {
            headers: document.getElementById('headers-container'),
            params: document.getElementById('params-container'),
            form: document.getElementById('form-data-container')
        };
        
        const container = containers[type];
        if (!container) return;
        
        const pair = document.createElement('div');
        pair.className = 'kv-pair';
        
        const keyPlaceholders = {
            headers: 'Header name',
            params: 'Parameter name', 
            form: 'Field name'
        };
        
        const valuePlaceholders = {
            headers: 'Header value',
            params: 'Parameter value',
            form: 'Field value'
        };
        
        pair.innerHTML = `
            <input type="text" class="form-control" placeholder="${keyPlaceholders[type]}" />
            <input type="text" class="form-control" placeholder="${valuePlaceholders[type]}" />
            <button type="button" class="kv-remove-btn" title="Remove">×</button>
        `;
        
        // Add event listeners
        const removeBtn = pair.querySelector('.kv-remove-btn');
        removeBtn.addEventListener('click', () => {
            pair.remove();
            this.updateCurrentRequest();
        });
        
        const inputs = pair.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('input', () => this.updateCurrentRequest());
        });
        
        container.appendChild(pair);
        this.updateCurrentRequest();
    }
    
    addEmptyKVPairs() {
        ['headers', 'params'].forEach(type => {
            this.addKVPair(type);
        });
    }
    
    updateCurrentRequest() {
        // Update headers
        const headerPairs = document.querySelectorAll('#headers-container .kv-pair');
        this.currentRequest.headers = Array.from(headerPairs).map(pair => {
            const inputs = pair.querySelectorAll('input');
            return {
                key: inputs[0].value.trim(),
                value: inputs[1].value.trim()
            };
        }).filter(h => h.key || h.value);
        
        // Update params
        const paramPairs = document.querySelectorAll('#params-container .kv-pair');
        this.currentRequest.params = Array.from(paramPairs).map(pair => {
            const inputs = pair.querySelectorAll('input');
            return {
                key: inputs[0].value.trim(),
                value: inputs[1].value.trim()
            };
        }).filter(p => p.key || p.value);
        
        // Update body
        const bodyTextarea = document.getElementById('body-textarea');
        if (bodyTextarea) {
            this.currentRequest.body = bodyTextarea.value;
        }
        
        // Update auth
        this.updateAuthFromForm();
    }
    
    updateAuthFields() {
        const authType = document.getElementById('auth-type').value;
        const authFields = document.getElementById('auth-fields');
        
        this.currentRequest.auth = { type: authType };
        authFields.innerHTML = '';
        
        if (authType === 'bearer') {
            authFields.innerHTML = `
                <div class="auth-field">
                    <label>Bearer Token</label>
                    <input type="text" id="bearer-token" class="form-control" placeholder="Enter bearer token" />
                </div>
            `;
            document.getElementById('bearer-token').addEventListener('input', () => this.updateAuthFromForm());
        } else if (authType === 'apikey') {
            authFields.innerHTML = `
                <div class="auth-field">
                    <label>Key Name</label>
                    <input type="text" id="api-key-name" class="form-control" placeholder="e.g., X-API-Key" />
                </div>
                <div class="auth-field">
                    <label>Key Value</label>
                    <input type="text" id="api-key-value" class="form-control" placeholder="Enter API key" />
                </div>
                <div class="auth-field">
                    <label>Add To</label>
                    <select id="api-key-location" class="form-control">
                        <option value="header">Header</option>
                        <option value="query">Query Parameter</option>
                    </select>
                </div>
            `;
            authFields.querySelectorAll('input, select').forEach(el => {
                el.addEventListener('change', () => this.updateAuthFromForm());
                el.addEventListener('input', () => this.updateAuthFromForm());
            });
        } else if (authType === 'basic') {
            authFields.innerHTML = `
                <div class="auth-field">
                    <label>Username</label>
                    <input type="text" id="basic-username" class="form-control" placeholder="Enter username" />
                </div>
                <div class="auth-field">
                    <label>Password</label>
                    <input type="password" id="basic-password" class="form-control" placeholder="Enter password" />
                </div>
            `;
            authFields.querySelectorAll('input').forEach(input => {
                input.addEventListener('input', () => this.updateAuthFromForm());
            });
        }
    }
    
    updateAuthFromForm() {
        const authType = this.currentRequest.auth.type;
        
        if (authType === 'bearer') {
            const token = document.getElementById('bearer-token')?.value || '';
            this.currentRequest.auth = { type: authType, token };
        } else if (authType === 'apikey') {
            const keyName = document.getElementById('api-key-name')?.value || '';
            const keyValue = document.getElementById('api-key-value')?.value || '';
            const location = document.getElementById('api-key-location')?.value || 'header';
            this.currentRequest.auth = { type: authType, keyName, keyValue, location };
        } else if (authType === 'basic') {
            const username = document.getElementById('basic-username')?.value || '';
            const password = document.getElementById('basic-password')?.value || '';
            this.currentRequest.auth = { type: authType, username, password };
        }
    }
    
    updateBodyType() {
        const bodyType = document.querySelector('input[name="body-type"]:checked')?.value || 'json';
        this.currentRequest.bodyType = bodyType;
        
        const bodyTextarea = document.getElementById('body-textarea');
        const formDataContainer = document.getElementById('form-data-container');
        const addFormFieldBtn = document.getElementById('add-form-field-btn');
        
        if (bodyType === 'form') {
            bodyTextarea.style.display = 'none';
            formDataContainer.style.display = 'block';
            addFormFieldBtn.style.display = 'inline-block';
        } else {
            bodyTextarea.style.display = 'block';
            formDataContainer.style.display = 'none';
            addFormFieldBtn.style.display = 'none';
        }
    }
    
    formatJSON() {
        const bodyTextarea = document.getElementById('body-textarea');
        if (!bodyTextarea.value.trim()) return;
        
        try {
            const parsed = JSON.parse(bodyTextarea.value);
            bodyTextarea.value = JSON.stringify(parsed, null, 2);
            this.currentRequest.body = bodyTextarea.value;
        } catch (error) {
            alert('Invalid JSON format');
        }
    }
    
    async sendRequest() {
        const sendBtn = document.getElementById('send-btn');
        const originalText = sendBtn.textContent;
        
        // Update UI
        sendBtn.textContent = 'Sending...';
        sendBtn.disabled = true;
        sendBtn.classList.add('loading');
        
        const startTime = Date.now();
        
        try {
            const url = this.buildURL();
            const options = this.buildRequestOptions();
            
            const response = await fetch(url, options);
            const endTime = Date.now();
            const responseTime = endTime - startTime;
            
            const responseText = await response.text();
            let responseData;
            
            try {
                responseData = JSON.parse(responseText);
            } catch {
                responseData = responseText;
            }
            
            const responseHeaders = {};
            response.headers.forEach((value, key) => {
                responseHeaders[key] = value;
            });
            
            this.displayResponse({
                status: response.status,
                statusText: response.statusText,
                headers: responseHeaders,
                data: responseData,
                time: responseTime,
                size: responseText.length
            });
            
            // Add to history
            this.addToHistory();
            
        } catch (error) {
            this.displayError(error);
        } finally {
            // Reset UI
            sendBtn.textContent = originalText;
            sendBtn.disabled = false;
            sendBtn.classList.remove('loading');
        }
    }
    
    buildURL() {
        let url = this.currentRequest.url;
        
        // Replace environment variables if any
        if (this.environments[this.currentEnvIndex - 1]) {
            const env = this.environments[this.currentEnvIndex - 1];
            url = url.replace(/\{\{(\w+)\}\}/g, (match, key) => {
                return env.variables[key] || match;
            });
        }
        
        // Add query parameters
        const validParams = this.currentRequest.params.filter(p => p.key.trim());
        if (validParams.length > 0) {
            const searchParams = new URLSearchParams();
            validParams.forEach(param => {
                searchParams.append(param.key, param.value);
            });
            
            const paramString = searchParams.toString();
            if (paramString) {
                url += (url.includes('?') ? '&' : '?') + paramString;
            }
        }
        
        // Add API key as query param if needed
        if (this.currentRequest.auth.type === 'apikey' && 
            this.currentRequest.auth.location === 'query' &&
            this.currentRequest.auth.keyName && 
            this.currentRequest.auth.keyValue) {
            
            const separator = url.includes('?') ? '&' : '?';
            url += `${separator}${this.currentRequest.auth.keyName}=${this.currentRequest.auth.keyValue}`;
        }
        
        return url;
    }
    
    buildRequestOptions() {
        const options = {
            method: this.currentRequest.method,
            headers: {}
        };
        
        // Add regular headers
        this.currentRequest.headers.forEach(header => {
            if (header.key.trim()) {
                options.headers[header.key] = header.value;
            }
        });
        
        // Add auth headers
        if (this.currentRequest.auth.type === 'bearer' && this.currentRequest.auth.token) {
            options.headers['Authorization'] = `Bearer ${this.currentRequest.auth.token}`;
        } else if (this.currentRequest.auth.type === 'apikey' && 
                   this.currentRequest.auth.location === 'header' &&
                   this.currentRequest.auth.keyName && 
                   this.currentRequest.auth.keyValue) {
            options.headers[this.currentRequest.auth.keyName] = this.currentRequest.auth.keyValue;
        } else if (this.currentRequest.auth.type === 'basic' && 
                   this.currentRequest.auth.username && 
                   this.currentRequest.auth.password) {
            const credentials = btoa(`${this.currentRequest.auth.username}:${this.currentRequest.auth.password}`);
            options.headers['Authorization'] = `Basic ${credentials}`;
        }
        
        // Add body for applicable methods
        if (['POST', 'PUT', 'PATCH'].includes(this.currentRequest.method)) {
            if (this.currentRequest.bodyType === 'form') {
                const formData = new FormData();
                const formPairs = document.querySelectorAll('#form-data-container .kv-pair');
                Array.from(formPairs).forEach(pair => {
                    const inputs = pair.querySelectorAll('input');
                    const key = inputs[0].value.trim();
                    const value = inputs[1].value.trim();
                    if (key) formData.append(key, value);
                });
                options.body = formData;
            } else if (this.currentRequest.body.trim()) {
                options.body = this.currentRequest.body;
            }
        }
        
        return options;
    }
    
    displayResponse(response) {
        this.lastResponse = response;
        
        // Update status
        const statusEl = document.getElementById('response-status');
        const statusClass = this.getStatusClass(response.status);
        statusEl.textContent = `${response.status} ${response.statusText}`;
        statusEl.className = `status ${statusClass}`;
        
        // Update timing and size
        document.getElementById('response-time').textContent = `${response.time}ms`;
        document.getElementById('response-size').textContent = this.formatBytes(response.size);
        
        // Display headers
        const headersDisplay = document.getElementById('response-headers-display');
        const headersText = Object.entries(response.headers)
            .map(([key, value]) => `${key}: ${value}`)
            .join('\n');
        headersDisplay.textContent = headersText || 'No headers';
        
        // Display body - FIXED: Properly target the code element and display content
        const bodyDisplay = document.getElementById('response-body');
        const codeEl = bodyDisplay.querySelector('code');
        
        if (codeEl) {
            if (typeof response.data === 'object') {
                const jsonText = JSON.stringify(response.data, null, 2);
                codeEl.innerHTML = this.highlightJSON(jsonText);
            } else {
                codeEl.textContent = response.data.toString();
            }
        } else {
            // Fallback if no code element found
            if (typeof response.data === 'object') {
                const jsonText = JSON.stringify(response.data, null, 2);
                bodyDisplay.innerHTML = this.highlightJSON(jsonText);
            } else {
                bodyDisplay.textContent = response.data.toString();
            }
        }
    }
    
    displayError(error) {
        const statusEl = document.getElementById('response-status');
        statusEl.textContent = `Error`;
        statusEl.className = 'status status--error';
        
        document.getElementById('response-time').textContent = '0ms';
        document.getElementById('response-size').textContent = '0B';
        
        const bodyDisplay = document.getElementById('response-body');
        const codeEl = bodyDisplay.querySelector('code') || bodyDisplay;
        codeEl.textContent = `Request failed: ${error.message}`;
        
        document.getElementById('response-headers-display').textContent = 'No headers';
        
        this.lastResponse = null;
    }
    
    getStatusClass(status) {
        if (status >= 200 && status < 300) return 'status--success';
        if (status >= 300 && status < 400) return 'status--warning';
        if (status >= 400) return 'status--error';
        return 'status--info';
    }
    
    formatBytes(bytes) {
        if (bytes === 0) return '0B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + sizes[i];
    }
    
    highlightJSON(json) {
        return json
            .replace(/(".*?")(\s*:\s*)(".*?")/g, '<span class="json-key">$1</span>$2<span class="json-string">$3</span>')
            .replace(/(".*?")(\s*:\s*)(\d+\.?\d*)/g, '<span class="json-key">$1</span>$2<span class="json-number">$3</span>')
            .replace(/(".*?")(\s*:\s*)(true|false)/g, '<span class="json-key">$1</span>$2<span class="json-boolean">$3</span>')
            .replace(/(".*?")(\s*:\s*)(null)/g, '<span class="json-key">$1</span>$2<span class="json-null">$3</span>');
    }
    
    addToHistory() {
        const historyItem = {
            timestamp: Date.now(),
            ...JSON.parse(JSON.stringify(this.currentRequest)) // Deep copy
        };
        
        this.requestHistory.unshift(historyItem);
        if (this.requestHistory.length > 50) {
            this.requestHistory = this.requestHistory.slice(0, 50);
        }
        
        this.updateHistoryDisplay();
        this.saveToStorage();
    }
    
    copyResponse() {
        if (!this.lastResponse) {
            this.showToast('No response to copy');
            return;
        }
        
        const text = typeof this.lastResponse.data === 'object' 
            ? JSON.stringify(this.lastResponse.data, null, 2)
            : this.lastResponse.data;
            
        navigator.clipboard.writeText(text).then(() => {
            this.showToast('Response copied to clipboard');
        }).catch(() => {
            this.showToast('Failed to copy response');
        });
    }
    
    clearResponse() {
        document.getElementById('response-status').textContent = 'Ready';
        document.getElementById('response-status').className = 'status status--info';
        document.getElementById('response-time').textContent = '0ms';
        document.getElementById('response-size').textContent = '0B';
        
        const bodyDisplay = document.getElementById('response-body');
        const codeEl = bodyDisplay.querySelector('code') || bodyDisplay;
        codeEl.textContent = 'No response yet. Send a request to see results here.';
        
        document.getElementById('response-headers-display').textContent = 'No headers';
        this.lastResponse = null;
    }
    
    showSaveModal() {
        const modal = document.getElementById('save-modal');
        modal.classList.add('active');
        document.getElementById('save-name-input').focus();
    }
    
    hideSaveModal() {
        const modal = document.getElementById('save-modal');
        modal.classList.remove('active');
        document.getElementById('save-name-input').value = '';
        document.getElementById('save-description-input').value = '';
    }
    
    saveRequest() {
        const name = document.getElementById('save-name-input').value.trim();
        const description = document.getElementById('save-description-input').value.trim();
        
        if (!name) {
            alert('Please enter a request name');
            return;
        }
        
        const savedRequest = {
            id: Date.now(),
            name,
            description,
            timestamp: Date.now(),
            ...JSON.parse(JSON.stringify(this.currentRequest)) // Deep copy
        };
        
        this.savedRequests.push(savedRequest);
        this.updateSavedRequestsDisplay();
        this.saveToStorage();
        this.hideSaveModal();
        this.showToast('Request saved successfully');
    }
    
    loadRequest(request) {
        this.currentRequest = {
            method: request.method,
            url: request.url,
            headers: [...(request.headers || [])],
            params: [...(request.params || [])],
            auth: {...(request.auth || { type: 'none' })},
            body: request.body || '',
            bodyType: request.bodyType || 'json'
        };
        
        this.updateUI();
        this.showToast('Request loaded');
    }
    
    updateUI() {
        // Update form controls
        document.getElementById('method-select').value = this.currentRequest.method;
        document.getElementById('url-input').value = this.currentRequest.url;
        document.getElementById('body-textarea').value = this.currentRequest.body;
        
        // Update body type
        const bodyTypeRadio = document.querySelector(`input[name="body-type"][value="${this.currentRequest.bodyType}"]`);
        if (bodyTypeRadio) {
            bodyTypeRadio.checked = true;
            this.updateBodyType();
        }
        
        // Update auth
        document.getElementById('auth-type').value = this.currentRequest.auth.type;
        this.updateAuthFields();
        
        // Populate auth fields
        setTimeout(() => {
            if (this.currentRequest.auth.type === 'bearer' && this.currentRequest.auth.token) {
                const tokenInput = document.getElementById('bearer-token');
                if (tokenInput) tokenInput.value = this.currentRequest.auth.token;
            } else if (this.currentRequest.auth.type === 'apikey') {
                const nameInput = document.getElementById('api-key-name');
                const valueInput = document.getElementById('api-key-value');
                const locationSelect = document.getElementById('api-key-location');
                if (nameInput && this.currentRequest.auth.keyName) nameInput.value = this.currentRequest.auth.keyName;
                if (valueInput && this.currentRequest.auth.keyValue) valueInput.value = this.currentRequest.auth.keyValue;
                if (locationSelect && this.currentRequest.auth.location) locationSelect.value = this.currentRequest.auth.location;
            } else if (this.currentRequest.auth.type === 'basic') {
                const usernameInput = document.getElementById('basic-username');
                const passwordInput = document.getElementById('basic-password');
                if (usernameInput && this.currentRequest.auth.username) usernameInput.value = this.currentRequest.auth.username;
                if (passwordInput && this.currentRequest.auth.password) passwordInput.value = this.currentRequest.auth.password;
            }
        }, 100);
        
        // Clear existing KV pairs
        document.getElementById('headers-container').innerHTML = '';
        document.getElementById('params-container').innerHTML = '';
        
        // Populate headers
        this.currentRequest.headers.forEach(header => {
            this.addKVPair('headers');
            const container = document.getElementById('headers-container');
            const lastPair = container.lastElementChild;
            const inputs = lastPair.querySelectorAll('input');
            inputs[0].value = header.key;
            inputs[1].value = header.value;
        });
        
        // Populate params
        this.currentRequest.params.forEach(param => {
            this.addKVPair('params');
            const container = document.getElementById('params-container');
            const lastPair = container.lastElementChild;
            const inputs = lastPair.querySelectorAll('input');
            inputs[0].value = param.key;
            inputs[1].value = param.value;
        });
        
        // Add empty pairs if none exist
        if (this.currentRequest.headers.length === 0) this.addKVPair('headers');
        if (this.currentRequest.params.length === 0) this.addKVPair('params');
        
        // Update displays
        this.updateEnvironmentSelect();
        this.updateSavedRequestsDisplay();
        this.updateHistoryDisplay();
    }
    
    updateEnvironmentSelect() {
        const select = document.getElementById('environment-select');
        select.innerHTML = '<option value="0">None</option>';
        
        this.environments.forEach((env, index) => {
            const option = document.createElement('option');
            option.value = index + 1;
            option.textContent = env.name;
            select.appendChild(option);
        });
        
        select.value = this.currentEnvIndex;
    }
    
    updateSavedRequestsDisplay() {
        const container = document.getElementById('saved-requests');
        
        if (this.savedRequests.length === 0) {
            container.innerHTML = '<div class="empty-state">No saved requests</div>';
            return;
        }
        
        container.innerHTML = this.savedRequests.map(request => `
            <div class="request-item" data-id="${request.id}">
                <div class="request-name">${request.name}</div>
                <div class="request-meta">
                    <span class="request-method ${request.method}">${request.method}</span>
                    <span class="request-url">${this.truncateUrl(request.url)}</span>
                </div>
            </div>
        `).join('');
        
        // Add click listeners
        container.querySelectorAll('.request-item').forEach(item => {
            item.addEventListener('click', () => {
                const id = parseInt(item.dataset.id);
                const request = this.savedRequests.find(r => r.id === id);
                if (request) this.loadRequest(request);
            });
        });
    }
    
    updateHistoryDisplay() {
        const container = document.getElementById('request-history');
        
        if (this.requestHistory.length === 0) {
            container.innerHTML = '<div class="empty-state">No history</div>';
            return;
        }
        
        container.innerHTML = this.requestHistory.slice(0, 10).map((request, index) => `
            <div class="request-item" data-index="${index}">
                <div class="request-name">${new Date(request.timestamp).toLocaleTimeString()}</div>
                <div class="request-meta">
                    <span class="request-method ${request.method}">${request.method}</span>
                    <span class="request-url">${this.truncateUrl(request.url)}</span>
                </div>
            </div>
        `).join('');
        
        // Add click listeners
        container.querySelectorAll('.request-item').forEach(item => {
            item.addEventListener('click', () => {
                const index = parseInt(item.dataset.index);
                const request = this.requestHistory[index];
                if (request) this.loadRequest(request);
            });
        });
    }
    
    truncateUrl(url, maxLength = 40) {
        if (url.length <= maxLength) return url;
        return url.substring(0, maxLength - 3) + '...';
    }
    
    importSampleRequests() {
        // Clear existing saved requests first
        this.savedRequests = [];
        
        // Import sample requests with proper formatting
        this.sampleData.requests.forEach(req => {
            const savedRequest = {
                id: Date.now() + Math.random(),
                timestamp: Date.now(),
                name: req.name,
                description: '',
                method: req.method,
                url: req.url,
                headers: req.headers || [],
                params: [],
                auth: { type: 'none' },
                body: req.body || '',
                bodyType: 'json'
            };
            this.savedRequests.push(savedRequest);
        });
        
        // Import environments
        this.environments = this.sampleData.environments.map(env => ({
            name: env.name,
            variables: { base_url: env.baseUrl }
        }));
        
        this.updateUI();
        this.saveToStorage();
        this.showToast('Sample requests imported');
    }
    
    clearHistory() {
        this.requestHistory = [];
        this.updateHistoryDisplay();
        this.saveToStorage();
        this.showToast('History cleared');
    }
    
    showEnvModal() {
        const modal = document.getElementById('env-modal');
        modal.classList.add('active');
        this.updateEnvModalDisplay();
    }
    
    hideEnvModal() {
        const modal = document.getElementById('env-modal');
        modal.classList.remove('active');
    }
    
    updateEnvModalDisplay() {
        const container = document.getElementById('env-list');
        
        if (this.environments.length === 0) {
            container.innerHTML = '<div class="empty-state">No environments</div>';
            return;
        }
        
        container.innerHTML = this.environments.map((env, index) => `
            <div class="env-item">
                <input type="text" class="form-control" value="${env.name}" data-index="${index}" data-field="name" />
                <input type="text" class="form-control" value="${env.variables.base_url || ''}" data-index="${index}" data-field="base_url" placeholder="Base URL" />
                <button type="button" class="env-remove-btn" data-index="${index}">×</button>
            </div>
        `).join('');
        
        // Add event listeners
        container.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', (e) => {
                const index = parseInt(e.target.dataset.index);
                const field = e.target.dataset.field;
                
                if (field === 'name') {
                    this.environments[index].name = e.target.value;
                } else if (field === 'base_url') {
                    this.environments[index].variables.base_url = e.target.value;
                }
                
                this.saveToStorage();
                this.updateEnvironmentSelect();
            });
        });
        
        container.querySelectorAll('.env-remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.environments.splice(index, 1);
                this.updateEnvModalDisplay();
                this.updateEnvironmentSelect();
                this.saveToStorage();
            });
        });
    }
    
    addEnvironment() {
        this.environments.push({
            name: `Environment ${this.environments.length + 1}`,
            variables: { base_url: '' }
        });
        
        this.updateEnvModalDisplay();
        this.updateEnvironmentSelect();
        this.saveToStorage();
    }
    
    showToast(message) {
        // Simple toast notification
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: var(--color-surface);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-base);
            padding: 12px 16px;
            box-shadow: var(--shadow-lg);
            z-index: 10000;
            font-size: 14px;
            color: var(--color-text);
            max-width: 300px;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 3000);
    }
    
    saveToStorage() {
        try {
            const data = {
                environments: this.environments,
                currentEnvIndex: this.currentEnvIndex,
                savedRequests: this.savedRequests,
                requestHistory: this.requestHistory,
                isDarkMode: this.isDarkMode
            };
            localStorage.setItem('rest-api-client', JSON.stringify(data));
        } catch (error) {
            console.warn('Failed to save to localStorage:', error);
            this.showToast('Failed to save data');
        }
    }
    
    loadFromStorage() {
        try {
            const data = localStorage.getItem('rest-api-client');
            if (data) {
                const parsed = JSON.parse(data);
                this.environments = parsed.environments || [];
                this.currentEnvIndex = parsed.currentEnvIndex || 0;
                this.savedRequests = parsed.savedRequests || [];
                this.requestHistory = parsed.requestHistory || [];
                this.isDarkMode = parsed.isDarkMode !== undefined ? parsed.isDarkMode : true;
            }
        } catch (error) {
            console.warn('Failed to load from localStorage:', error);
        }
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new RestApiClient();
});