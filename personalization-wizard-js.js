// console.log("wizard.js is being executed");

// let currentStep = 1;
// const totalSteps = 4;
// let prevBtn, nextBtn;

function navigate(direction) {
    console.log('Navigate called with direction:', direction);
    
    if (direction === 1 && !validateStep(currentStep)) {
        console.log('Validation failed for step:', currentStep);
        return;
    }

    const wizard = document.getElementById('wizard');
    const currentStepElement = wizard.querySelector(`.step[data-step="${currentStep}"]`);
    const nextStepNumber = currentStep + direction;
    const nextStepElement = wizard.querySelector(`.step[data-step="${nextStepNumber}"]`);

    console.log('Current step:', currentStep);
    console.log('Next step:', nextStepNumber);

    if (currentStepElement && nextStepElement) {
        currentStepElement.classList.remove('active');
        nextStepElement.classList.add('active');
        currentStep = nextStepNumber;

        prevBtn.disabled = currentStep === 1;
        nextBtn.textContent = currentStep === totalSteps ? 'Finish' : 'Next';

        if (currentStep === totalSteps) {
            updateSummary();
            nextBtn.style.display = 'none';
        } else {
            nextBtn.style.display = 'initial';
        }

        console.log('Navigation successful. New current step:', currentStep);
    } else {
        console.log('Navigation failed. Could not find step elements.');
    }
}

function validateStep(step) {
    console.log('Validating step:', step);
    if (step === 1) {
        const motivation = document.querySelector('input[name="motivation"]:checked');
        if (!motivation) {
            alert('Please select your primary motivation.');
            return false;
        }
    } else if (step === 2) {
        const role = document.getElementById('role').value;
        if (!role) {
            alert('Please select your current role.');
            return false;
        }
    }
    return true;
}

function setupMutualExclusion() {
    const guideCheckbox = document.getElementById('generative_ai_guide');
    const topicsList = document.getElementById('topics-list');

    // Event listener for the "Generative AI Guide" checkbox
    guideCheckbox.addEventListener('change', function() {
        if (this.checked) {
            const otherInterests = topicsList.querySelectorAll('input[type="checkbox"]');
            otherInterests.forEach(checkbox => {
                if (checkbox !== guideCheckbox) {
                    checkbox.checked = false;
                }
            });
        }
    });

    // Event delegation for checkboxes in the topics list
    topicsList.addEventListener('change', function(event) {
        if (event.target.matches('input[type="checkbox"]') && event.target !== guideCheckbox) {
            if (event.target.checked) {
                guideCheckbox.checked = false;
            }
        }
    });
}

// Existing code in personalization-wizard-js.js
console.log("wizard.js is being executed");

let currentStep = 1;
const totalSteps = 4;
let prevBtn, nextBtn;

// Fetch CSV file from the same directory
async function fetchCSV(fileName) {
    try {
        const response = await fetch(fileName);
        if (!response.ok) {
            throw new Error(`Failed to load ${fileName}`);
        }
        const csvText = await response.text();
        return parseCSVToObject(csvText);
    } catch (error) {
        console.error('Error fetching CSV file:', error);
    }
}

// Parse CSV into an array of objects
function parseCSVToObject(csv) {
    const rows = csv.trim().split(/\r?\n/); // Split CSV into rows while handling both Unix and Windows line endings
    const headers = rows[0].split(','); // Get headers from the first row

    return rows.slice(1).map(row => {
        const values = splitCSVRow(row);
        return headers.reduce((acc, header, index) => {
            acc[header.trim()] = values[index] ? values[index].trim() : '';
            return acc;
        }, {});
    });
}

// Helper function to split a CSV row into values, respecting quoted values and preventing incorrect splits
function splitCSVRow(row) {
    const regex = /("([^"]*)"|[^",\s]+|[^,]+)(,|$)/g; // Match quoted strings or non-quoted values
    let matches = [];
    let match;

    while ((match = regex.exec(row)) !== null) {
        let value = match[2] !== undefined ? match[2] : match[1];
        matches.push(value.replace(/^"|"$/g, "")); // Remove quotes if present
    }

    return matches;
}

// Fetch course descriptions from CSV
async function fetchCourseDescriptions() {
    try {
        const response = await fetch('./course_description.csv');
        if (!response.ok) {
            throw new Error('Failed to load course_description.csv');
        }
        const csvText = await response.text();
        return parseCSVToObject(csvText);
    } catch (error) {
        console.error('Error fetching course descriptions:', error);
    }
}

async function updateCoursesSections(jobTitle, selectedTopics) {
    console.log('Updating courses sections for job title:', jobTitle);

    const completions = await fetchCSV('./jobtitle_completions.csv');
    const enrollments = await fetchCSV('./jobtitle_enrollments.csv');
    const ratings = await fetchCSV('./jobtitle_nps.csv');
    const courseDescriptions = await fetchCourseDescriptions();

    if (completions && enrollments && ratings && courseDescriptions) {
        // console.log('Parsed completions:', completions);
        // console.log('Parsed enrollments:', enrollments);
        // console.log('Parsed ratings:', ratings);
        // console.log('Parsed course descriptions:', courseDescriptions);

        const normalizedJobTitle = jobTitle.toLowerCase().trim();

        // Create a mapping of course_id to course description for easy lookup
        const courseDescriptionsMap = courseDescriptions.reduce((acc, entry) => {
            acc[entry['course_id']] = entry['index_page_card_excerpt'];
            return acc;
        }, {});
        // console.log(courseDescriptionsMap);
        // Filter completions based on the job title name
        const filteredCompletions = completions.filter(entry => 
            entry['job_title_name'].toLowerCase().trim() === normalizedJobTitle
        );

        const mostCompletedCourses = filteredCompletions
            .sort((a, b) => parseInt(b['completions']) - parseInt(a['completions']))
            .slice(0, 5)
            .map(entry => ({
                courseTitle: entry['name'],
                courseLink: `https://learn.deeplearning.ai/courses/${entry['en_name']}`,
                courseDescription: courseDescriptionsMap[entry['course_id']] || 'No description available'
            }));

        // Filter enrollments based on the job title name
        const filteredEnrollments = enrollments.filter(entry => 
            entry['job_title_name'].toLowerCase().trim() === normalizedJobTitle
        );

        const mostEnrolledCourses = filteredEnrollments
            .sort((a, b) => parseInt(b['enrollments']) - parseInt(a['enrollments']))
            .slice(0, 5)
            .map(entry => ({
                courseTitle: entry['name'],
                courseLink: `https://learn.deeplearning.ai/courses/${entry['en_name']}`,
                courseDescription: courseDescriptionsMap[entry['course_id']] || 'No description available'
            }));

        const filteredRatings = ratings.filter(entry => 
            entry['job_title_name'].toLowerCase().trim() === normalizedJobTitle
        );

        const highestRatingsCourses = filteredRatings
            .sort((a, b) => parseInt(b['nps']) - parseInt(a['nps']))
            .slice(0, 5)
            .map(entry => ({
                courseTitle: entry['name'],
                courseLink: `https://learn.deeplearning.ai/courses/${entry['en_name']}`,
                courseDescription: courseDescriptionsMap[entry['course_id']] || 'No description available'
            }));

        let relatedCoursesHtml = '';

        if (selectedTopics.length === 1 && selectedTopics[0] === 'Beginner-friendly! Check out our guide to Generative AI courses') {
            relatedCoursesHtml = `
                <a href="https://www.deeplearning.ai/resources/generative-ai-courses-guide/" target="_blank" style="color: #f65b66; font-weight: bold; text-decoration: underline; margin-bottom: 16px; display: inline-block;">
                    Explore our courses with our comprehensive Generative AI Course Guide
                </a>
            `;
        } else if (selectedTopics.length > 0) {
            const baseUrl = 'https://www.deeplearning.ai/courses/?courses_date_desc%5BrefinementList%5D%5Bcourse_type%5D%5B0%5D=Short%20Courses';
            const topicParams = selectedTopics.map((topic, index) =>
                `&courses_date_desc%5BrefinementList%5D%5Btopic%5D%5B${index}%5D=${encodeURIComponent(topic)}`
            ).join('');
            const fullUrl = baseUrl + topicParams;

            relatedCoursesHtml = `
                <a href="${fullUrl}" target="_blank" style="color: #f65b66; font-weight: bold; text-decoration: underline; margin-bottom: 16px; display: inline-block;">
                    Courses related to ${selectedTopics.join(', ')}
                </a>
            `;
        }


        const highestRatedCoursesHtml = highestRatingsCourses.map(course => `
            <div style="border: 1px solid #ddd; border-radius: 8px; padding: 16px; margin-bottom: 16px; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);">
                <a href="${course.courseLink}" target="_blank" style="text-decoration: none; color: #007bff;">
                    <h4 style="margin: 0; font-weight: bold;">${course.courseTitle}</h4>
                </a>
                <p style="margin-top: 8px; color: #555;">${course.courseDescription}</p>
            </div>
        `).join('');

        // Update the DOM to show course title, link, and description separately
        const mostCompletedCoursesHtml = mostCompletedCourses.map(course => `
            <div style="border: 1px solid #ddd; border-radius: 8px; padding: 16px; margin-bottom: 16px; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);">
                <a href="${course.courseLink}" target="_blank" style="text-decoration: none; color: #007bff;">
                    <h4 style="margin: 0; font-weight: bold;">${course.courseTitle}</h4>
                </a>
                <p style="margin-top: 8px; color: #555;">${course.courseDescription}</p>
            </div>
        `).join('');


        const mostEnrolledCoursesHtml = mostEnrolledCourses.map(course => `
            <div style="border: 1px solid #ddd; border-radius: 8px; padding: 16px; margin-bottom: 16px; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);">
                <a href="${course.courseLink}" target="_blank" style="text-decoration: none; color: #007bff;">
                    <h4 style="margin: 0; font-weight: bold;">${course.courseTitle}</h4>
                </a>
                <p style="margin-top: 8px; color: #555;">${course.courseDescription}</p>
            </div>
        `).join('');

        document.getElementById('job-title-based-recommendation').innerHTML = `
            <h3 class="text-xl font-semibold mb-2" >Here are the courses that professionals in the ${jobTitle} field have taken:</h3>
        `;

        document.getElementById('related-courses-section').innerHTML =` 
            <h3 class="text-xl font-semibold mb-2" >Explore our courses based on the topics you're interested in</h3>
            ${relatedCoursesHtml || ''}
        `;
        
        document.getElementById('highest-rated-courses').innerHTML = `
            <h3 class="text-lg font-semibold mb-2" style="color: #f65b66;">Highest-rated</h3>
            ${highestRatedCoursesHtml || '<p>No data available</p>'}
        `;

        // Update the DOM with collapsible sections for most completed and most enrolled courses using symbols
        document.getElementById('most-completed-courses').innerHTML = `
            <div style="display: flex; align-items: center; cursor: pointer;" onclick="toggleSection('completed-courses-content', this)">
                <span style="font-size: 24px; user-select: none; margin-right: 10px;">+</span>
                <h3 class="text-lg font-semibold mb-2" style="margin: 0;">Most completed</h3>
            </div>
            <div id="completed-courses-content" style="display: none; margin-top: 10px;">
                ${mostCompletedCoursesHtml || '<p>No data available</p>'}
            </div>
        `;

        document.getElementById('most-enrolled-courses').innerHTML = `
            <div style="display: flex; align-items: center; cursor: pointer;" onclick="toggleSection('enrolled-courses-content', this)">
                <span style="font-size: 24px; user-select: none; margin-right: 10px;">+</span>
                <h3 class="text-lg font-semibold mb-2" style="margin: 0;">Most popular</h3>
            </div>
            <div id="enrolled-courses-content" style="display: none; margin-top: 10px;">
                ${mostEnrolledCoursesHtml || '<p>No data available</p>'}
            </div>
        `;

        console.log('Updated the courses sections in the DOM');
    } else {
        console.error('Completions, enrollments, or course descriptions data is missing');
    }
}

function toggleSection(sectionId, toggleElement) {
    const section = document.getElementById(sectionId);
    const symbol = toggleElement.querySelector('span');

    if (section.style.display === 'none' || section.style.display === '') {
        section.style.display = 'block';
        symbol.textContent = '-';
    } else {
        section.style.display = 'none';
        symbol.textContent = '+';
    }
}

// Update summary function with course sections update
function updateSummary() {
    console.log('Updating summary');
    const motivationElement = document.querySelector('input[name="motivation"]:checked');
    const motivationText = motivationElement ? motivationElement.parentElement.textContent.trim() : '';
    const role = document.getElementById('role').options[document.getElementById('role').selectedIndex].text;
    const interests = Array.from(document.querySelectorAll('input[name="interests"]:checked'))
        .map(checkbox => checkbox.parentElement.textContent.trim())
        .join(', ');

    const summary = `Primary Motivation: ${motivationText}<br>Current Role: ${role}<br>Interests: ${interests}`;
    document.getElementById('summary').innerHTML = summary;

    // Update course sections based on job title
    updateCoursesSections(role, interests.split(', '));
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded and parsed');

    prevBtn = document.getElementById('prevBtn');
    nextBtn = document.getElementById('nextBtn');

    prevBtn.addEventListener('click', function() {
        navigate(-1);
    });

    nextBtn.addEventListener('click', function() {
        navigate(1);
    });

    prevBtn.disabled = true;
    setupMutualExclusion();
});
