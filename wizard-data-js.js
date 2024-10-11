// CSV data for job titles
const jobTitlesData = `ID,En Name
18,Other
17,Entrepreneur
16,General Management / Executive
15,Marketing / PR / Sales
14,Legal / Law Professional
13,Human Resource Professional
12,Healthcare Professional
11,Finance
10,Consulting
9,Educator / Teacher / Professor
8,Product Management
7,Machine Learning Researcher
6,Hardware Engineer
5,Software Engineer
4,Software Engineer - Machine Learning
3,Machine Learning Engineer
2,Data Analyst
1,Data Scientist
0,Prefer not to answer`;

// CSV data for topics
const topicsData = `AI in Software Development
AI Safety
Anomaly Detection
Chatbots
Compression and Quantization
Computer Vision
Data Processing
Deep Learning
Diffusion Models
Document Processing
Embeddings
Evaluation and Monitoring
Event-Driven AI
Fine-Tuning
GenAI Applications
Generative Models
LLM Serving
LLMOps
Machine Learning
MLOps
MultiModal
NLP
On-Device AI
Prompt Engineering
RAG
Search and Retrieval
Task Automation
Transformers`;

function parseCSV(csv) {
    return csv.split('\n').map(row => row.split(','));
}

function populateJobTitles() {
    const roleSelect = document.getElementById('role');
    const jobTitles = parseCSV(jobTitlesData);
    // console.log(jobTitles);
    
    // Skip the header row
    jobTitles.slice(1).forEach(([id, title]) => {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = title;
        roleSelect.appendChild(option);
    });
}

function populateTopics() {
    const topicsList = document.getElementById('topics-list');
    const topics = topicsData.split('\n');
    
    topics.forEach(topic => {
        const li = document.createElement('li');
        const label = document.createElement('label');
        label.className = 'flex items-center';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.name = 'interests';
        checkbox.value = topic.toLowerCase().replace(/\s+/g, '_');
        checkbox.className = 'mr-2';
        
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(topic));
        li.appendChild(label);
        topicsList.appendChild(li);
    });
}

document.addEventListener('DOMContentLoaded', function() {
    populateJobTitles();
    populateTopics();
});
