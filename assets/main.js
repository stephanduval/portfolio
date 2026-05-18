// Load and render skills from JSON
async function loadSkills() {
    try {
        const response = await fetch('data/skills.json');
        const data = await response.json();
        const skillsGrid = document.getElementById('skillsGrid');

        data.skills.forEach(skill => {
            const skillCard = document.createElement('div');
            skillCard.className = 'skill-card';
            skillCard.innerHTML = `
                <img src="assets/icons/${skill.icon}" alt="${skill.title}" class="skill-icon">
                <h3>${skill.title}</h3>
                <p>${skill.description}</p>
            `;
            skillsGrid.appendChild(skillCard);
        });
    } catch (error) {
        console.error('Error loading skills:', error);
    }
}

// Load and render projects from JSON
async function loadProjects() {
    try {
        const response = await fetch('data/projects.json');
        const data = await response.json();
        const projectsGrid = document.getElementById('projectsGrid');

        data.projects.forEach(project => {
            const projectCard = document.createElement('div');
            projectCard.className = `project-card ${project.type}`;

            const tagsHTML = project.tags
                .map(tag => `<span>${tag}</span>`)
                .join('');

            projectCard.innerHTML = `
                <div class="project-icon">
                    <img src="assets/icons/${project.icon}" alt="${project.title}" class="project-icon-img${project.animation ? ` ${project.animation}` : ''}">
                </div>
                <h3>${project.title}</h3>
                <p class="project-type">${project.type === 'software' ? 'Software Project' : 'Maker Project'}</p>
                <p>${project.description}</p>
                <div class="project-tags">
                    ${tagsHTML}
                </div>
            `;
            projectsGrid.appendChild(projectCard);
        });
    } catch (error) {
        console.error('Error loading projects:', error);
    }
}

// Load data on page load
document.addEventListener('DOMContentLoaded', () => {
    loadSkills();
    loadProjects();
});

// Smooth scroll for nav links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// Add scroll animations to elements
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe skill cards and project cards after they're loaded
setTimeout(() => {
    document.querySelectorAll('.skill-card, .project-card').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}, 100);

// Add parallax effect to hero icons on scroll
window.addEventListener('scroll', () => {
    const heroIcons = document.querySelectorAll('.hero-icon');
    const scrolled = window.pageYOffset;

    heroIcons.forEach((icon, index) => {
        const direction = index % 2 === 0 ? 1 : -1;
        icon.style.transform = `translateY(${scrolled * 0.5 * direction}px)`;
    });
});

// Navbar background on scroll
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.background = 'rgba(255, 255, 255, 0.98)';
        navbar.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
    } else {
        navbar.style.background = 'rgba(255, 255, 255, 0.95)';
        navbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
    }
});

// Copy email to clipboard
document.addEventListener('DOMContentLoaded', () => {
    const copyBtn = document.getElementById('copyEmail');
    if (copyBtn) {
        copyBtn.addEventListener('click', function() {
            const email = 'portfolio.stephandou@mail.stephandouglasduval.com';
            navigator.clipboard.writeText(email).then(() => {
                const btn = this;
                const originalTitle = btn.title;
                btn.title = 'Copied!';
                btn.classList.add('copied');

                setTimeout(() => {
                    btn.title = originalTitle;
                    btn.classList.remove('copied');
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy email:', err);
            });
        });
    }
});

console.log('Portfolio site loaded with data-driven content');
