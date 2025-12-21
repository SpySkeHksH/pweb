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

    // 3. State
    let projects = [];
    let currentEditingId = null;

    // 4. Fetch Initial Data
    fetch('projects.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            projects = data;
            renderProjects();
        })
        .catch(error => {
            console.error('Error fetching projects:', error);
            alert('프로젝트 데이터를 불러오는 데 실패했습니다.');
        });

    // 5. Render Function
    function renderProjects() {
        projectListContainer.innerHTML = '';
        if (projects.length === 0) {
            projectListContainer.innerHTML = '<p>표시할 프로젝트가 없습니다.</p>';
            return;
        }
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

    // 6. Modal Handling
    function openModal(project = null) {
        projectForm.reset();
        if (project) {
            currentEditingId = project.id;
            modalTitle.textContent = '프로젝트 수정';
            document.getElementById('project-id').value = project.id;
            document.getElementById('title').value = project.title;
            document.getElementById('subtitle').value = project.subtitle;
            document.getElementById('year').value = project.year;
            document.getElementById('mainImage').value = project.mainImage;
            document.getElementById('overview').value = project.overview;
            document.getElementById('gallery').value = project.gallery.join(', ');
            document.getElementById('mainPage_category').value = project.mainPage.category;
            document.getElementById('mainPage_description').value = project.mainPage.description;
        } else {
            currentEditingId = null;
            modalTitle.textContent = '새 프로젝트 추가';
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
        if (e.target === modal) {
            closeModal();
        }
    });

    // 7. Form Submission (Add/Edit)
    projectForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const formData = new FormData(projectForm);
        const galleryValue = formData.get('gallery').trim();

        const projectData = {
            id: currentEditingId ? parseInt(currentEditingId) : getNewId(),
            title: formData.get('title'),
            subtitle: formData.get('subtitle'),
            year: formData.get('year'),
            mainImage: formData.get('mainImage'),
            overview: formData.get('overview'),
            gallery: galleryValue ? galleryValue.split(',').map(item => item.trim()) : [],
            links: currentEditingId ? projects.find(p => p.id === currentEditingId).links : [], // Preserve links on edit
            mainPage: {
                category: formData.get('mainPage_category'),
                title: formData.get('title'), // Title is the same
                image: formData.get('mainImage'), // Main image is the same
                description: formData.get('mainPage_description')
            }
        };

        if (currentEditingId) {
            // Edit existing project
            projects = projects.map(p => p.id === currentEditingId ? projectData : p);
        } else {
            // Add new project
            projects.push(projectData);
        }
        
        projects.sort((a, b) => a.id - b.id);
        renderProjects();
        closeModal();
    });

    function getNewId() {
        return projects.length > 0 ? Math.max(...projects.map(p => p.id)) + 1 : 1;
    }

    // 8. Delete Functionality (with event delegation)
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

    // 9. Save to JSON and Download
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
});
