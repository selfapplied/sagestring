/**
 * MIT OCW Downloader: Fetch and Structure Course Data for CE Learning
 *
 * Downloads MIT OpenCourseWare course data and transforms it into
 * CE-structured format for the education loader.
 *
 * Author: Joel
 */

class MITOCWDownloader {
  constructor(options = {}) {
    this.baseUrl = 'https://ocw.mit.edu';
    this.apiBase = 'https://ocw.mit.edu/courses';
    this.cache = new Map();
    this.rateLimit = options.rateLimit || 1000; // ms between requests
    this.lastRequest = 0;
  }

  /**
   * Download course by course number (e.g., "18-01sc", "6-006")
   */
  async downloadCourse(courseNumber) {
    const courseId = this.normalizeCourseNumber(courseNumber);
    
    console.log(`📥 Downloading MIT OCW course: ${courseId}`);

    try {
      // Fetch course metadata
      const metadata = await this.fetchCourseMetadata(courseId);
      
      // Fetch course content
      const content = await this.fetchCourseContent(courseId);
      
      // Structure as CE format
      const ceCourse = this.structureAsCE(metadata, content);
      
      console.log(`✅ Course "${ceCourse.title}" downloaded and structured`);
      return ceCourse;
    } catch (error) {
      console.error(`❌ Error downloading course ${courseId}:`, error);
      throw error;
    }
  }

  /**
   * Normalize course number format
   */
  normalizeCourseNumber(courseNumber) {
    // Handle various formats: "18.01", "18-01", "18.01sc", etc.
    return courseNumber.replace(/\./g, '-').toLowerCase();
  }

  /**
   * Fetch course metadata
   */
  async fetchCourseMetadata(courseId) {
    // Try multiple endpoints
    const endpoints = [
      `${this.apiBase}/${courseId}/index.json`,
      `${this.apiBase}/${courseId}/course-json/index.json`,
      `${this.baseUrl}/courses/${courseId}/index.json`
    ];

    for (const url of endpoints) {
      try {
        const response = await this.rateLimitedFetch(url);
        if (response.ok) {
          const data = await response.json();
          if (data && (data.title || data.course_id)) {
            return data;
          }
        }
      } catch (error) {
        continue;
      }
    }

    // Fallback: try to parse from HTML
    return await this.fetchMetadataFromHTML(courseId);
  }

  /**
   * Fetch course content (sections, lectures, readings)
   */
  async fetchCourseContent(courseId) {
    const content = {
      sections: [],
      lectures: [],
      readings: [],
      assignments: []
    };

    try {
      // Try to fetch structured content
      const sectionsUrl = `${this.apiBase}/${courseId}/sections/index.json`;
      const response = await this.rateLimitedFetch(sectionsUrl);
      
      if (response.ok) {
        const sections = await response.json();
        content.sections = sections;
        
        // Fetch detailed content for each section
        for (const section of sections) {
          if (section.url) {
            const sectionContent = await this.fetchSectionContent(courseId, section);
            content.lectures.push(...sectionContent.lectures || []);
            content.readings.push(...sectionContent.readings || []);
          }
        }
      } else {
        // Fallback: parse from HTML
        content.sections = await this.fetchSectionsFromHTML(courseId);
      }
    } catch (error) {
      console.warn(`Could not fetch structured content, using HTML fallback:`, error);
      content.sections = await this.fetchSectionsFromHTML(courseId);
    }

    return content;
  }

  /**
   * Fetch section content
   */
  async fetchSectionContent(courseId, section) {
    const content = {
      lectures: [],
      readings: []
    };

    if (!section.url) return content;

    // Try multiple URL formats
    const urlVariants = [
      `${this.baseUrl}${section.url}/index.json`,
      `${this.apiBase}/${courseId}${section.url}/index.json`,
      `${this.baseUrl}${section.url}.json`
    ];

    for (const sectionUrl of urlVariants) {
      try {
        const response = await this.rateLimitedFetch(sectionUrl);
        
        if (response.ok) {
          const sectionData = await response.json();
          
          // Extract lectures
          if (sectionData.lecture_notes || sectionData.lectures) {
            const lectures = sectionData.lecture_notes || sectionData.lectures || [];
            content.lectures = lectures.map(lec => ({
              id: lec.id || `lecture_${Date.now()}_${Math.random()}`,
              title: lec.title || lec.name || 'Untitled Lecture',
              content: lec.description || lec.text || lec.summary || '',
              url: lec.url || section.url
            }));
          }

          // Extract readings
          if (sectionData.readings) {
            content.readings = sectionData.readings.map(reading => ({
              id: reading.id || `reading_${Date.now()}_${Math.random()}`,
              title: reading.title || reading.name || 'Untitled Reading',
              content: reading.description || reading.text || reading.summary || '',
              url: reading.url
            }));
          }

          // If we got data, return it
          if (content.lectures.length > 0 || content.readings.length > 0) {
            return content;
          }
        }
      } catch (error) {
        continue;
      }
    }

    // Fallback: try HTML parsing
    try {
      const htmlUrl = `${this.baseUrl}${section.url}`;
      const html = await this.rateLimitedFetch(htmlUrl).then(r => r.text());
      const parsed = this.parseSectionFromHTML(html, section);
      if (parsed.lectures.length > 0 || parsed.readings.length > 0) {
        return parsed;
      }
    } catch (error) {
      console.warn(`Could not fetch section content:`, error);
    }

    return content;
  }

  /**
   * Parse section from HTML
   */
  parseSectionFromHTML(html, section) {
    const content = { lectures: [], readings: [] };
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Extract lecture titles and descriptions
    const lectureElements = doc.querySelectorAll('.lecture, .lecture-note, h3, h4');
    lectureElements.forEach((el, idx) => {
      const title = el.textContent?.trim();
      const nextText = el.nextElementSibling?.textContent?.trim() || '';
      
      if (title && title.length > 5) {
        content.lectures.push({
          id: `lecture_${section.id}_${idx}`,
          title: title,
          content: nextText.substring(0, 500) || title,
          url: section.url
        });
      }
    });

    return content;
  }

  /**
   * Fetch metadata from HTML (fallback)
   */
  async fetchMetadataFromHTML(courseId) {
    const url = `${this.apiBase}/${courseId}`;
    const html = await this.rateLimitedFetch(url).then(r => r.text());
    
    // Parse HTML for course info
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    const title = doc.querySelector('h1')?.textContent?.trim() || 
                  doc.querySelector('title')?.textContent?.trim() || 
                  courseId;
    
    const description = doc.querySelector('.course-description')?.textContent?.trim() ||
                       doc.querySelector('meta[name="description"]')?.getAttribute('content') ||
                       '';

    return {
      course_id: courseId,
      title: title,
      description: description
    };
  }

  /**
   * Fetch sections from HTML (fallback)
   */
  async fetchSectionsFromHTML(courseId) {
    const url = `${this.apiBase}/${courseId}`;
    const html = await this.rateLimitedFetch(url).then(r => r.text());
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    const sections = [];
    
    // Look for section headings or navigation
    const sectionElements = doc.querySelectorAll('h2, .section-title, .lecture-title');
    
    sectionElements.forEach((el, index) => {
      const title = el.textContent?.trim();
      if (title && title.length > 3) {
        sections.push({
          id: `section_${index}`,
          title: title,
          url: null
        });
      }
    });

    return sections;
  }

  /**
   * Structure course data as CE format
   */
  structureAsCE(metadata, content) {
    const ceCourse = {
      title: metadata.title || metadata.course_id || 'MIT OCW Course',
      description: metadata.description || '',
      domains: []
    };

    // Group content into domains (sections become domains)
    const sections = content.sections || [];
    
    if (sections.length > 0) {
      // Use sections as domains
      for (const section of sections) {
        const domain = {
          id: section.id || `domain_${ceCourse.domains.length}`,
          name: section.title || section.name || `Section ${ceCourse.domains.length + 1}`,
          concepts: []
        };

        // Add lectures as concepts
        const sectionLectures = content.lectures.filter(l => 
          l.url?.includes(section.url) || section.url?.includes(l.url)
        );
        
        for (const lecture of sectionLectures) {
          domain.concepts.push({
            id: lecture.id,
            name: lecture.title,
            content: lecture.content || lecture.description || '',
            invariants: this.extractInvariants(lecture.content || lecture.description)
          });
        }

        // Add readings as concepts
        const sectionReadings = content.readings.filter(r =>
          r.url?.includes(section.url) || section.url?.includes(r.url)
        );

        for (const reading of sectionReadings) {
          domain.concepts.push({
            id: reading.id,
            name: reading.title,
            content: reading.content || reading.description || '',
            invariants: this.extractInvariants(reading.content || reading.description)
          });
        }

        // If no lectures/readings, create concept from section itself
        if (domain.concepts.length === 0 && section.description) {
          domain.concepts.push({
            id: `concept_${domain.id}`,
            name: domain.name,
            content: section.description,
            invariants: this.extractInvariants(section.description)
          });
        }

        if (domain.concepts.length > 0) {
          ceCourse.domains.push(domain);
        }
      }
    } else {
      // Fallback: create single domain with all content
      const domain = {
        id: 'main',
        name: 'Course Content',
        concepts: []
      };

      // Add all lectures
      for (const lecture of content.lectures) {
        domain.concepts.push({
          id: lecture.id,
          name: lecture.title,
          content: lecture.content || lecture.description || '',
          invariants: this.extractInvariants(lecture.content || lecture.description)
        });
      }

      // Add all readings
      for (const reading of content.readings) {
        domain.concepts.push({
          id: reading.id,
          name: reading.title,
          content: reading.content || reading.description || '',
          invariants: this.extractInvariants(reading.content || reading.description)
        });
      }

      if (domain.concepts.length > 0) {
        ceCourse.domains.push(domain);
      }
    }

    // If still no domains, create minimal structure
    if (ceCourse.domains.length === 0) {
      ceCourse.domains.push({
        id: 'overview',
        name: 'Course Overview',
        concepts: [{
          id: 'intro',
          name: ceCourse.title,
          content: ceCourse.description || 'Course content from MIT OCW',
          invariants: ['core_principle']
        }]
      });
    }

    return ceCourse;
  }

  /**
   * Extract invariants from content
   */
  extractInvariants(content) {
    if (!content) return ['core_principle'];
    
    const invariants = [];
    const text = content.toLowerCase();

    if (text.includes('always') || text.includes('never') || text.includes('must')) {
      invariants.push('universal_principle');
    }
    if (text.includes('transform') || text.includes('map') || text.includes('convert')) {
      invariants.push('morphism_structure');
    }
    if (text.includes('relation') || text.includes('connect') || text.includes('link')) {
      invariants.push('domain_connection');
    }
    if (text.includes('proof') || text.includes('demonstrate') || text.includes('show')) {
      invariants.push('witness_verification');
    }
    if (text.includes('example') || text.includes('instance')) {
      invariants.push('instantiation');
    }

    return invariants.length > 0 ? invariants : ['core_principle'];
  }

  /**
   * Rate-limited fetch
   */
  async rateLimitedFetch(url) {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequest;
    
    if (timeSinceLastRequest < this.rateLimit) {
      await new Promise(resolve => 
        setTimeout(resolve, this.rateLimit - timeSinceLastRequest)
      );
    }

    this.lastRequest = Date.now();

    // Check cache
    if (this.cache.has(url)) {
      return new Response(this.cache.get(url), {
        status: 200,
        statusText: 'OK',
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Fetch with CORS proxy if needed (for browser)
    let fetchUrl = url;
    if (typeof window !== 'undefined') {
      // In browser, may need CORS proxy
      // For now, try direct fetch (MIT OCW may allow CORS)
      try {
        const response = await fetch(url, {
          mode: 'cors',
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.text();
          this.cache.set(url, data);
          return response;
        }
      } catch (error) {
        // CORS error - will need proxy or server-side fetch
        console.warn(`CORS error for ${url}, may need server-side fetch`);
        throw new Error(`CORS error: ${error.message}`);
      }
    } else {
      // Node.js environment
      const fetch = (await import('node-fetch')).default;
      const response = await fetch(url);
      const data = await response.text();
      this.cache.set(url, data);
      return new Response(data, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      });
    }

    throw new Error('Fetch failed');
  }

  /**
   * Search for courses
   */
  async searchCourses(query, limit = 10) {
    // MIT OCW doesn't have a public search API, so we'll use a known list
    // or scrape the course index
    
    const popularCourses = [
      '18-01sc', '18-02sc', '18-03sc', // Calculus
      '6-006', '6-046j', '6-042j',     // CS
      '8-01', '8-02',                   // Physics
      '18-06', '18-700'                 // Math
    ];

    const results = popularCourses
      .filter(course => course.includes(query.toLowerCase()) || query === '')
      .slice(0, limit)
      .map(course => ({
        id: course,
        title: `MIT Course ${course}`,
        url: `${this.apiBase}/${course}`
      }));

    return results;
  }

  /**
   * Download and save course as JSON
   */
  async downloadAndSave(courseNumber, filename = null) {
    const course = await this.downloadCourse(courseNumber);
    
    const output = filename || `${courseNumber.replace(/[^a-z0-9]/gi, '_')}_ce.json`;
    
    if (typeof window !== 'undefined') {
      // Browser: download as file
      const blob = new Blob([JSON.stringify(course, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = output;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // Node.js: write to file
      const fs = await import('fs');
      fs.writeFileSync(output, JSON.stringify(course, null, 2));
      console.log(`💾 Saved to ${output}`);
    }

    return course;
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MITOCWDownloader };
}

