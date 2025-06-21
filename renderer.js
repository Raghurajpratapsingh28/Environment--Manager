class EnvironmentUI {
    constructor() {
        this.currentEditingKey = null;
        this.isEditing = false;
        this.envVars = {};
        this.currentFolder = 'default';
        this.folders = ['default'];
        
        this.initializeElements();
        this.attachEventListeners();
        this.initializeApp();
    }


    initializeElements() {
        this.varForm = document.getElementById('varForm');
        this.varKey = document.getElementById('varKey');
        this.varValue = document.getElementById('varValue');
        this.saveBtn = document.getElementById('saveBtn');
        this.cancelBtn = document.getElementById('cancelBtn');
        
        this.envList = document.getElementById('envList');
        this.emptyState = document.getElementById('emptyState');
        
        this.varModal = document.getElementById('varModal');
        this.confirmModal = document.getElementById('confirmModal');
        this.folderModal = document.getElementById('folderModal');
        this.modalTitle = document.getElementById('modalTitle');
        this.closeModal = document.getElementById('closeModal');
        this.closeConfirmModal = document.getElementById('closeConfirmModal');
        this.closeFolderModal = document.getElementById('closeFolderModal');
        this.confirmMessage = document.getElementById('confirmMessage');
        this.confirmBtn = document.getElementById('confirmBtn');
        this.cancelConfirmBtn = document.getElementById('cancelConfirmBtn');
        
        this.addVarBtn = document.getElementById('addVarBtn');
        this.copyAllBtn = document.getElementById('copyAllBtn');
        this.importBtn = document.getElementById('importBtn');
        this.exportBtn = document.getElementById('exportBtn');
        
        this.folderSelect = document.getElementById('folderSelect');
        this.createFolderBtn = document.getElementById('createFolderBtn');
        this.deleteFolderBtn = document.getElementById('deleteFolderBtn');
        this.folderForm = document.getElementById('folderForm');
        this.folderName = document.getElementById('folderName');
        this.saveFolderBtn = document.getElementById('saveFolderBtn');
        this.cancelFolderBtn = document.getElementById('cancelFolderBtn');
    }


    async initializeApp() {
        await this.loadFolders();
        await this.loadEnvironmentVariables();
    }


    async loadFolders() {
        try {
            const folders = await window.electronAPI.getFolders();
            this.folders = folders;
            this.renderFolderSelect();
            
            const currentFolder = await window.electronAPI.getCurrentFolder();
            this.currentFolder = currentFolder;
            this.folderSelect.value = currentFolder;
            
        } catch (error) {
            console.error('Failed to load folders:', error);
            this.showNotification('Failed to load folders', 'error');
        }
    }


    renderFolderSelect() {
        this.folderSelect.innerHTML = this.folders.map(folder => 
            `<option value="${this.escapeHtml(folder)}">${this.escapeHtml(folder)}</option>`
        ).join('');
    }


    attachEventListeners() {
        this.varForm.addEventListener('submit', this.handleFormSubmit.bind(this));

        this.addVarBtn.addEventListener('click', this.showAddModal.bind(this));
        this.copyAllBtn.addEventListener('click', this.handleCopyAll.bind(this));
        this.closeModal.addEventListener('click', this.hideModal.bind(this));
        this.cancelBtn.addEventListener('click', this.hideModal.bind(this));
        
        this.closeConfirmModal.addEventListener('click', this.hideConfirmModal.bind(this));
        this.cancelConfirmBtn.addEventListener('click', this.hideConfirmModal.bind(this));
        
        this.createFolderBtn.addEventListener('click', this.showFolderModal.bind(this));
        this.closeFolderModal.addEventListener('click', this.hideFolderModal.bind(this));
        this.cancelFolderBtn.addEventListener('click', this.hideFolderModal.bind(this));
        this.folderForm.addEventListener('submit', this.handleFolderFormSubmit.bind(this));
        
        this.folderSelect.addEventListener('change', this.handleFolderChange.bind(this));
        this.deleteFolderBtn.addEventListener('click', this.handleDeleteFolder.bind(this));
        
        this.importBtn.addEventListener('click', this.handleImport.bind(this));
        this.exportBtn.addEventListener('click', this.handleExport.bind(this));
        
        document.addEventListener('keydown', this.handleKeydown.bind(this));
        
        this.varModal.addEventListener('click', (e) => {
            if (e.target === this.varModal) {
                this.hideModal();
            }
        });
        
        this.confirmModal.addEventListener('click', (e) => {
            if (e.target === this.confirmModal) {
                this.hideConfirmModal();
            }
        });
        
        this.folderModal.addEventListener('click', (e) => {
            if (e.target === this.folderModal) {
                this.hideFolderModal();
            }
        });
        
        this.envList.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const key = btn.closest('.env-item').dataset.key;
                
                if (e.ctrlKey || e.button === 2) {
                    e.preventDefault();
                    await this.showCopyOptions(key);
                } else {
                    const result = await this.copyToClipboard(this.envVars[key]);
                    if (result.error) {
                        this.showNotification(result.error, 'error');
                    } else {
                        this.showNotification('Value copied to clipboard', 'success');
                    }
                }
            });
            
            btn.addEventListener('contextmenu', (e) => {
                e.preventDefault();
            });
        });
    }


    async handleFolderChange(e) {
        const newFolder = e.target.value;
        
        try {
            const result = await window.electronAPI.switchFolder(newFolder);
            
            if (result.error) {
                this.showNotification(result.error, 'error');
                this.folderSelect.value = this.currentFolder;
                return;
            }
            
            this.currentFolder = newFolder;
            this.showNotification(`Switched to ${newFolder} folder`, 'success');
            await this.loadEnvironmentVariables();
            
        } catch (error) {
            this.showNotification('Failed to switch folder', 'error');  
            this.folderSelect.value = this.currentFolder;
        }
    }


    async handleDeleteFolder() {
        if (this.currentFolder === 'default') {
            this.showNotification('Cannot delete the default folder', 'warning');
            return;
        }
        
        this.showConfirmModal(
            `Are you sure you want to delete the "${this.currentFolder}" folder? This will permanently delete all environment variables in this folder.`,
            async () => {
                try {
                    const result = await window.electronAPI.deleteFolder(this.currentFolder);
                    
                    if (result.error) {
                        this.showNotification(result.error, 'error');
                        return;
                    }
                    
                    this.showNotification('Folder deleted successfully', 'success');
                    this.hideConfirmModal();
                    await this.loadFolders();
                    await this.loadEnvironmentVariables();
                    
                } catch (error) {
                    this.showNotification('Failed to delete folder', 'error');
                }
            }
        );
    }

    showFolderModal() {
        this.folderModal.classList.add('show');
        this.folderName.focus();
    }


    hideFolderModal() {
        this.folderModal.classList.remove('show');
        this.folderForm.reset();
    }

    async handleFolderFormSubmit(e) {
        e.preventDefault();
        
        const folderName = this.folderName.value.trim();
        
        if (!folderName) {
            this.showNotification('Folder name cannot be empty', 'error');
            this.folderName.focus();
            return;
        }
        

        if (this.folders.includes(folderName)) {
            this.showNotification('Folder already exists', 'error');
            this.folderName.focus();
            return;
        }
        
        try {
            const result = await window.electronAPI.createFolder(folderName);
            
            if (result.error) {
                this.showNotification(result.error, 'error');
                return;
            }
            
            this.showNotification('Folder created successfully', 'success');
            this.hideFolderModal();
            await this.loadFolders();
            
            // Switch to the new folder
            this.folderSelect.value = result.folderName;
            await this.handleFolderChange({ target: { value: result.folderName } });
            
        } catch (error) {
            this.showNotification('Failed to create folder', 'error');
        }
    }


    handleKeydown(e) {
        // Escape key to close modals
        if (e.key === 'Escape') {
            if (this.confirmModal.classList.contains('show')) {
                this.hideConfirmModal();
            } else if (this.folderModal.classList.contains('show')) {
                this.hideFolderModal();
            } else if (this.varModal.classList.contains('show')) {
                this.hideModal();
            }
        }
        
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            this.showAddModal();
        }
        
     
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'N') {
            e.preventDefault();
            this.showFolderModal();
        }
    }


    async loadEnvironmentVariables() {
        try {
            const result = await window.electronAPI.loadEnvVars();
            
            if (result.error) {
                this.showNotification(result.error, 'error');
                return;
            }
            
            this.envVars = result;
            this.renderVariablesList();
        } catch (error) {
            this.showNotification('Failed to load environment variables', 'error');
            console.error('Load error:', error);
        }
    }


    async handleFormSubmit(e) {
        e.preventDefault();
        
        const key = this.varKey.value.trim();
        const value = this.varValue.value;
        
        if (!key) {
            this.showNotification('Variable name cannot be empty', 'error');
            this.varKey.focus();
            return;
        }
        
        // Check for duplicate keys (only when not editing or editing with different key)
        if (!this.isEditing && this.envVars.hasOwnProperty(key)) {
            this.showNotification('Variable name already exists', 'error');
            this.varKey.focus();
            return;
        }
        
        try {
            let result;
            
            if (this.isEditing) {
                result = await window.electronAPI.updateEnvVar(this.currentEditingKey, key, value);
            } else {
                result = await window.electronAPI.saveEnvVar(key, value);
            }
            
            if (result.error) {
                this.showNotification(result.error, 'error');
                return;
            }
            
            this.showNotification(result.message, 'success');
            this.hideModal();
            await this.loadEnvironmentVariables();
            
        } catch (error) {
            this.showNotification('Operation failed', 'error');
            console.error('Save/Update error:', error);
        }
    }


    showAddModal() {
        this.isEditing = false;
        this.currentEditingKey = null;
        this.modalTitle.innerHTML = '<i class="fas fa-plus"></i> Add Environment Variable';
        this.resetForm();
        this.varModal.classList.add('show');
        this.varKey.focus();
    }


    showEditModal(key) {
        this.isEditing = true;
        this.currentEditingKey = key;
        this.modalTitle.innerHTML = '<i class="fas fa-edit"></i> Edit Environment Variable';
        
        this.varKey.value = key;
        this.varValue.value = this.envVars[key];
        
        this.varModal.classList.add('show');
        this.varKey.focus();
        this.varKey.select();
    }


    hideModal() {
        this.varModal.classList.remove('show');
        this.resetForm();
    }

    /**
     * Show confirmation modal
     */
    showConfirmModal(message, action) {
        this.confirmMessage.textContent = message;
        this.confirmBtn.onclick = action;
        this.confirmModal.classList.add('show');
    }

    /**
     * Hide confirmation modal
     */
    hideConfirmModal() {
        this.confirmModal.classList.remove('show');
    }

    /**
     * Reset form to initial state
     */
    resetForm() {
        this.isEditing = false;
        this.currentEditingKey = null;
        this.varForm.reset();
    }

    /**
     * Delete environment variable
     */
    async deleteVariable(key) {
        try {
            const result = await window.electronAPI.deleteEnvVar(key);
            
            if (result.error) {
                this.showNotification(result.error, 'error');
                return;
            }
            
            this.showNotification(result.message, 'success');
            await this.loadEnvironmentVariables();
            
        } catch (error) {
            this.showNotification('Failed to delete variable', 'error');
            console.error('Delete error:', error);
        }
    }

    /**
     * Render the variables list
     */
    renderVariablesList() {
        const variables = Object.keys(this.envVars);
        
        if (variables.length === 0) {
            this.envList.innerHTML = '';
            this.emptyState.classList.add('show');
            return;
        }
        
        this.emptyState.classList.remove('show');
        
        this.envList.innerHTML = variables.map(key => this.createVariableItem(key)).join('');
        
        this.envList.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const key = btn.closest('.env-item').dataset.key;
                this.showEditModal(key);
            });
        });
        
        this.envList.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const key = btn.closest('.env-item').dataset.key;
                this.showConfirmModal(
                    `Are you sure you want to delete "${key}"?`,
                    () => {
                        this.deleteVariable(key);
                        this.hideConfirmModal();
                    }
                );
            });
        });
        
        this.envList.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const key = btn.closest('.env-item').dataset.key;
                
             
                if (e.ctrlKey || e.button === 2) {
                    e.preventDefault();
                    await this.showCopyOptions(key);
                } else {
                 
                    const result = await this.copyToClipboard(this.envVars[key]);
                    if (result.error) {
                        this.showNotification(result.error, 'error');
                    } else {
                        this.showNotification('Value copied to clipboard', 'success');
                    }
                }
            });
            
         
            btn.addEventListener('contextmenu', (e) => {
                e.preventDefault();
            });
        });
    }


    createVariableItem(key) {
        const value = this.envVars[key];
        const escapedKey = this.escapeHtml(key);
        const escapedValue = this.escapeHtml(value);
        
        return `
            <div class="env-item" data-key="${this.escapeHtml(key)}">
                <div class="env-item-header">
                    <div class="env-key">${escapedKey}</div>
                    <div class="env-actions">
                        <button class="action-btn copy-btn" title="Copy value (left-click) or show options (right-click)">
                            <i class="fas fa-copy"></i>
                        </button>
                        <button class="action-btn edit-btn" title="Edit variable">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete delete-btn" title="Delete variable">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="env-value">${escapedValue}</div>
            </div>
        `;
    }


    async showCopyOptions(key) {
        const options = [
            { text: 'Copy value', action: 'value' },
            { text: 'Copy key-value pair', action: 'key-value' },
            { text: 'Copy key only', action: 'key' }
        ];
        
        const selectedOption = await this.showExportOptions(options, 'Copy Options');
        
        if (!selectedOption) {
            return; 
        }
        
        try {
            let result;
            if (selectedOption === 'value') {
                result = await this.copyToClipboard(this.envVars[key]);
            } else if (selectedOption === 'key-value') {
                result = await this.copyToClipboard(`${key}=${this.envVars[key]}`);
            } else {
                result = await this.copyToClipboard(key);
            }
            
            if (result.error) {
                this.showNotification(result.error, 'error');
            } else {
                this.showNotification('Value copied to clipboard', 'success');
            }
            
        } catch (error) {
            this.showNotification('Failed to copy to clipboard', 'error');
            console.error('Copy error:', error);
        }
    }

  
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return { success: true };
        } catch (error) {
            console.error('Copy failed:', error);
            return { error: 'Failed to copy to clipboard' };
        }
    }

    /**
     * Handle copy all variables
     */
    async handleCopyAll() {
        try {
            if (Object.keys(this.envVars).length === 0) {
                this.showNotification('No environment variables to copy', 'warning');
                return;
            }

            // Format all variables as keyName = value (with spaces around equals)
            const formattedVars = Object.entries(this.envVars)
                .map(([key, value]) => `${key} = ${value}`)
                .join('\n');

            const result = await this.copyToClipboard(formattedVars);
            
            if (result.error) {
                this.showNotification(result.error, 'error');
            } else {
                const count = Object.keys(this.envVars).length;
                this.showNotification(`Copied ${count} environment variables to clipboard`, 'success');
            }
            
        } catch (error) {
            this.showNotification('Failed to copy environment variables', 'error');
            console.error('Copy all error:', error);
        }
    }

    /**
     * Handle import
     */
    async handleImport() {
        try {
            this.showNotification(`Importing to ${this.currentFolder} folder...`, 'info');
            const result = await window.electronAPI.importEnvVars();
            
            if (result.error) {
                this.showNotification(result.error, 'error');
                return;
            }
            
            if (result.success) {
                const message = result.importedCount 
                    ? `Successfully imported ${result.importedCount} environment variables`
                    : result.message;
                this.showNotification(message, 'success');
                await this.loadEnvironmentVariables();
            }
            
        } catch (error) {
            this.showNotification('Import failed', 'error');
            console.error('Import error:', error);
        }
    }

    
    async handleExport() {
        try {
            if (Object.keys(this.envVars).length === 0) {
                this.showNotification('No environment variables to export', 'warning');
                return;
            }
            
         
            const exportOptions = [
                { text: 'Export as .env file (direct save)', action: 'direct' },
                { text: 'Export with custom name/location', action: 'custom' }
            ];
            
            const selectedOption = await this.showExportOptions(exportOptions);
            
            if (!selectedOption) {
                return; 
            }
            
            this.showNotification(`Exporting from ${this.currentFolder} folder...`, 'info');
            
            let result;
            if (selectedOption === 'direct') {
                result = await window.electronAPI.exportEnvVars({ directExport: true });
            } else {
                result = await window.electronAPI.exportEnvVars({ directExport: false });
            }
            
            if (result.error) {
                this.showNotification(result.error, 'error');
                return;
            }
            
            if (result.success) {
                const message = selectedOption === 'direct' 
                    ? `Environment variables exported to Downloads/${this.currentFolder}.env`
                    : result.message;
                this.showNotification(message, 'success');
            }
            
        } catch (error) {
            this.showNotification('Export failed', 'error');
            console.error('Export error:', error);
        }
    }

    /**
     * Show export options dialog
     */
    showExportOptions(options, title = 'Export Options') {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'modal export-options-modal';
            modal.innerHTML = `
                <div class="modal-content" data-title="${title}">
                    <div class="modal-header">
                        <h3>${title}</h3>
                        <button class="close-btn" id="closeExportModal">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p>${title === 'Export Options' ? 'Choose how you want to export your environment variables:' : 'Choose what you want to copy:'}</p>
                        <div class="export-options">
                            ${options.map(option => `
                                <button class="export-option-btn" data-action="${option.action}">
                                    ${option.text}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Show modal
            setTimeout(() => modal.classList.add('show'), 100);
            
         
            modal.querySelectorAll('.export-option-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const action = btn.dataset.action;
                    modal.classList.remove('show');
                    setTimeout(() => {
                        modal.remove();
                        resolve(action);
                    }, 300);
                });
            });
            
      
            modal.querySelector('#closeExportModal').addEventListener('click', () => {
                modal.classList.remove('show');
                setTimeout(() => {
                    modal.remove();
                    resolve(null);
                }, 300);
            });
            

            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('show');
                    setTimeout(() => {
                        modal.remove();
                        resolve(null);
                    }, 300);
                }
            });
        });
    }


    showNotification(message, type = 'info') {

        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
     
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${this.getNotificationIcon(type)}"></i>
            ${this.escapeHtml(message)}
        `;
        
        document.body.appendChild(notification);
        

        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 5000);
    }

      
    getNotificationIcon(type) {
        switch (type) {
            case 'success': return 'check-circle';
            case 'error': return 'exclamation-circle';
            case 'warning': return 'exclamation-triangle';
            default: return 'info-circle';
        }
    }

    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}


document.addEventListener('DOMContentLoaded', () => {
    new EnvironmentUI();
});