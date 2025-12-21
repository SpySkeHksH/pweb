document.addEventListener('DOMContentLoaded', () => {
    // 1. Authentication
    if (sessionStorage.getItem('isLoggedIn') !== 'true') {
        window.location.href = 'login.html';
        return;
    }

    // 2. DOM Elements
    const projectListContainer = document.getElementById('project-list-admin');
    const addProjectBtn = document.getElementById('add-project-btn');
    const saveChangesBtn = document.getElementById('save-changes-btn');
    const modal = document.getElementById('project-modal');
    const modalTitle = document.getElementById('modal-title');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const projectForm = document.getElementById('project-form');
    const linksContainer = document.getElementById('links-container');
    const addLinkBtn = document.getElementById('add-link-btn');
    
    // GitHub elements
    const saveToGitHubBtn = document.getElementById('save-to-github-btn');
    const saveGitHubSettingsBtn = document.getElementById('save-github-settings-btn');
    const githubOwnerInput = document.getElementById('github-owner');
    const githubRepoInput = document.getElementById('github-repo');
    const githubBranchInput = document.getElementById('github-branch');
    const githubTokenInput = document.getElementById('github-token');

    // 3. State
    let projects = [];
    let currentEditingId = null;

    // 4. GitHub Settings Handling
    const GITHUB_SETTINGS_KEY = 'githubSettings';

    function saveGitHubSettings() {
        const settings = {
            owner: githubOwnerInput.value.trim(),
            repo: githubRepoInput.value.trim(),
            branch: githubBranchInput.value.trim(),
            token: githubTokenInput.value.trim()
        };
        if (!settings.owner || !settings.repo || !settings.branch || !settings.token) {
            alert('모든 GitHub 설정 필드를 채워주세요.');
            return;
        }
        localStorage.setItem(GITHUB_SETTINGS_KEY, JSON.stringify(settings));
        alert('GitHub 연동 설정이 저장되었습니다.');
    }

    function loadGitHubSettings() {
        const settings = JSON.parse(localStorage.getItem(GITHUB_SETTINGS_KEY));
        if (settings) {
            githubOwnerInput.value = settings.owner || '';
            githubRepoInput.value = settings.repo || '';
            githubBranchInput.value = settings.branch || '';
            githubTokenInput.value = settings.token || '';
        }
    }

    saveGitHubSettingsBtn.addEventListener('click', saveGitHubSettings);
    loadGitHubSettings();


    // 5. Fetch Initial Data
    fetch('projects.json')
        .then(response => response.json())
        .then(data => {
            projects = data;
            renderProjects();
        })
        .catch(error => {
            console.error('Error fetching projects:', error);
            // alert('프로젝트 데이터를 불러오는 데 실패했습니다.');
        });

    // 6. Render Function
    function renderProjects() {
        projectListContainer.innerHTML = '';
        projects.forEach(project => {
            const projectItem = document.createElement('div');
            projectItem.className = 'project-item-admin';
            projectItem.innerHTML = `
                <span class="project-item-admin-title">${project.id}: ${project.title}</span>
                <div class="project-item-admin-actions">
                    <button class="btn btn-secondary edit-btn" data-id="${project.id}">수정</button>
                    <button class="btn btn-secondary delete-btn" data-id="${project.id}">삭제</button>
                </div>
            `;
            projectListContainer.appendChild(projectItem);
        });
    }

    // 7. Modal and Link UI Handling
    function addLinkInput(link = { text: '', url: '' }) {
        const div = document.createElement('div');
        div.className = 'link-input-group';
        div.style.display = 'flex';
        div.style.gap = '10px';
        div.style.marginBottom = '10px';
        div.innerHTML = `
            <input type="text" placeholder="링크 텍스트 (e.g., 앱 체험 ↗)" class="form-input link-text" value="${link.text}" style="flex: 1;">
            <input type="text" placeholder="URL" class="form-input link-url" value="${link.url}" style="flex: 2;">
            <button type="button" class="btn btn-secondary remove-link-btn">삭제</button>
        `;
        linksContainer.appendChild(div);
    }

    addLinkBtn.addEventListener('click', () => addLinkInput());

    linksContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-link-btn')) {
            e.target.parentElement.remove();
        }
    });

    function openModal(project = null) {
        projectForm.reset();
        linksContainer.innerHTML = '';

        if (project) {
            currentEditingId = project.id;
            modalTitle.textContent = '프로젝트 수정';
            document.getElementById('project-id').value = project.id;
            document.getElementById('title').value = project.title;
            document.getElementById('subtitle').value = project.subtitle;
            document.getElementById('year').value = project.year;
            document.getElementById('mainImage').value = project.mainImage;
            document.getElementById('overview').value = project.overview;
            document.getElementById('gallery').value = project.gallery ? project.gallery.join(', ') : '';
            
            if (project.links) {
                project.links.forEach(link => addLinkInput(link));
            }

            document.getElementById('mainPage_category').value = project.mainPage.category;
            document.getElementById('mainPage_description').value = project.mainPage.description;
        } else {
            currentEditingId = null;
            modalTitle.textContent = '새 프로젝트 추가';
            addLinkInput();
        }
        modal.style.display = 'flex';
    }

    function closeModal() {
        modal.style.display = 'none';
        projectForm.reset();
    }

    addProjectBtn.addEventListener('click', () => openModal());
    closeModalBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // 8. Form Submission (Add/Edit)
    projectForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const formData = new FormData(projectForm);
        const galleryValue = formData.get('gallery').trim();

        const links = [];
        const linkGroups = linksContainer.querySelectorAll('.link-input-group');
        linkGroups.forEach(group => {
            const text = group.querySelector('.link-text').value.trim();
            const url = group.querySelector('.link-url').value.trim();
            if (text && url) {
                links.push({ text, url });
            }
        });

        const projectData = {
            id: currentEditingId ? parseInt(currentEditingId) : getNewId(),
            title: formData.get('title'),
            subtitle: formData.get('subtitle'),
            year: formData.get('year'),
            mainImage: formData.get('mainImage'),
            overview: formData.get('overview'),
            gallery: galleryValue ? galleryValue.split(',').map(item => item.trim()) : [],
            links: links,
            mainPage: {
                category: formData.get('mainPage_category'),
                title: formData.get('title'),
                image: formData.get('mainImage'),
                description: formData.get('mainPage_description')
            }
        };

        if (currentEditingId) {
            projects = projects.map(p => p.id === currentEditingId ? projectData : p);
        } else {
            projects.push(projectData);
        }
        
        projects.sort((a, b) => a.id - b.id);
        renderProjects();
        closeModal();
    });

    function getNewId() {
        return projects.length > 0 ? Math.max(...projects.map(p => p.id)) + 1 : 1;
    }

    // 9. Delete Functionality
    projectListContainer.addEventListener('click', (e) => {
        const target = e.target;
        if (target.classList.contains('delete-btn')) {
            const id = parseInt(target.dataset.id);
            if (confirm(`정말로 ID ${id} 프로젝트를 삭제하시겠습니까?`)) {
                projects = projects.filter(p => p.id !== id);
                renderProjects();
            }
        }
        if (target.classList.contains('edit-btn')) {
            const id = parseInt(target.dataset.id);
            const projectToEdit = projects.find(p => p.id === id);
            if (projectToEdit) {
                openModal(projectToEdit);
            }
        }
    });

    // 10. Save to JSON and Download
    saveChangesBtn.addEventListener('click', () => {
        const jsonString = JSON.stringify(projects, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'projects.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        alert('`projects.json` 파일이 다운로드되었습니다. 기존 파일을 이 파일로 교체해주세요.');
    });

    // 11. Save to GitHub
    async function saveToGitHub() {
        const settings = JSON.parse(localStorage.getItem(GITHUB_SETTINGS_KEY));
        if (!settings || !settings.owner || !settings.repo || !settings.branch || !settings.token) {
            alert('GitHub 연동 설정을 먼저 완료해주세요.');
            return;
        }

        const { owner, repo, branch, token } = settings;
        const path = 'projects.json';
        const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
        
        saveToGitHubBtn.textContent = '저장 중...';
        saveToGitHubBtn.disabled = true;

        try {
            // Step 1: Get the current file SHA
            let sha;
            try {
                const getFileResponse = await fetch(apiUrl + `?ref=${branch}`, {
                    headers: { 'Authorization': `token ${token}` }
                });
                if (getFileResponse.ok) {
                    const fileData = await getFileResponse.json();
                    sha = fileData.sha;
                } else if (getFileResponse.status !== 404) {
                    throw new Error(`Failed to get file SHA. Status: ${getFileResponse.status}`);
                }
            } catch (e) {
                 throw new Error(`파일 SHA를 가져오는 중 네트워크 오류 발생: ${e.message}`);
            }

            // Step 2: Create or update the file
            const content = JSON.stringify(projects, null, 2);
            // Robust Base64 encoding for Unicode
            const encodedContent = btoa(unescape(encodeURIComponent(content)));

            const payload = {
                message: `Update projects.json from admin panel`,
                content: encodedContent,
                branch: branch
            };
            if (sha) {
                payload.sha = sha; // Include SHA if updating an existing file
            }

            const updateFileResponse = await fetch(apiUrl, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!updateFileResponse.ok) {
                const errorData = await updateFileResponse.json();
                throw new Error(`GitHub API Error: ${errorData.message}`);
            }

            alert('`projects.json` 파일이 GitHub에 성공적으로 저장되었습니다!');

        } catch (error) {
            console.error('GitHub 저장 실패:', error);
            alert(`GitHub 저장 실패: ${error.message}`);
        } finally {
            saveToGitHubBtn.textContent = 'GitHub에 저장';
            saveToGitHubBtn.disabled = false;
        }
    }

    saveToGitHubBtn.addEventListener('click', saveToGitHub);
});
