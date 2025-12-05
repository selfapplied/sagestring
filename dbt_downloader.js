/**
 * DBT Materials Downloader: Fetch and Structure DBT Skills for CE Learning
 *
 * Downloads Dialectical Behavior Therapy materials and structures them
 * as CE domains for balanced, experiential learning alongside academic content.
 *
 * DBT Skills Modules:
 * - Mindfulness: Present-moment awareness
 * - Distress Tolerance: Crisis survival skills
 * - Emotion Regulation: Understanding and managing emotions
 * - Interpersonal Effectiveness: Relationship skills
 *
 * Author: Joel
 */

class DBTDownloader {
  constructor(options = {}) {
    this.sources = options.sources || [
      'workbook',
      'skills_manual',
      'online_resources'
    ];
    this.cache = new Map();
    this.rateLimit = options.rateLimit || 500;
    this.lastRequest = 0;
  }

  /**
   * Download DBT skills content
   */
  async downloadDBTContent(options = {}) {
    const moduleFilter = options.modules || null; // Filter specific modules
    
    console.log('📥 Downloading DBT materials...');

    try {
      // Load DBT skills structure
      const skills = this.getDBTSkillsStructure();
      
      // Filter by modules if specified
      const filteredSkills = moduleFilter 
        ? skills.filter(s => moduleFilter.includes(s.module))
        : skills;

      // Structure as CE format
      const ceCourse = this.structureAsCE(filteredSkills, options);
      
      console.log(`✅ DBT course "${ceCourse.title}" structured with ${ceCourse.domains.length} modules`);
      return ceCourse;
    } catch (error) {
      console.error('❌ Error downloading DBT content:', error);
      throw error;
    }
  }

  /**
   * Get DBT skills structure (core DBT skills)
   */
  getDBTSkillsStructure() {
    return [
      // MINDFULNESS MODULE
      {
        module: 'mindfulness',
        skill: 'wise_mind',
        name: 'Wise Mind',
        content: 'Wise Mind is the integration of emotion mind and reasonable mind. It is the synthesis of thinking and feeling, the place where you can access your inner wisdom. Wise Mind is like a deep knowing, a centered place of balance between extremes.',
        practice: 'Notice when you are in emotion mind (all feeling) or reasonable mind (all logic). Practice finding the middle path - the place where both are present. This is Wise Mind.',
        invariants: ['universal_principle', 'witness_verification']
      },
      {
        module: 'mindfulness',
        skill: 'observe',
        name: 'Observe',
        content: 'Observe means to notice, attend to, or watch your experience without getting caught in it. It is like watching clouds pass in the sky - you notice them but you do not grab onto them or push them away.',
        practice: 'Practice observing your thoughts, feelings, and sensations without judgment. Notice them come and go like waves on the shore.',
        invariants: ['witness_verification', 'domain_connection']
      },
      {
        module: 'mindfulness',
        skill: 'describe',
        name: 'Describe',
        content: 'Describe means to put words on your experience. It is labeling what you observe without adding interpretations or judgments. You stick to the facts of what you observe.',
        practice: 'When you notice a feeling, describe it: "I notice a tightness in my chest" rather than "I am anxious" or "This is terrible."',
        invariants: ['morphism_structure', 'witness_verification']
      },
      {
        module: 'mindfulness',
        skill: 'participate',
        name: 'Participate',
        content: 'Participate means to throw yourself completely into the present moment. It is being fully present and engaged in whatever you are doing, without self-consciousness.',
        practice: 'Practice doing one thing at a time with full attention. When eating, just eat. When walking, just walk. Be fully present.',
        invariants: ['universal_principle', 'instantiation']
      },

      // DISTRESS TOLERANCE MODULE
      {
        module: 'distress_tolerance',
        skill: 'stop',
        name: 'STOP',
        content: 'STOP is a crisis survival skill. Stop - do not just react. Take a step back. Observe what is happening. Proceed mindfully. This skill helps you pause before acting impulsively.',
        practice: 'When you feel an urge to act impulsively, literally say "STOP" to yourself. Take a breath. Notice what is happening. Then decide how to proceed wisely.',
        invariants: ['universal_principle', 'morphism_structure']
      },
      {
        module: 'distress_tolerance',
        skill: 'tip',
        name: 'TIP the Temperature',
        content: 'TIP stands for Temperature, Intense exercise, Paced breathing, and Paired muscle relaxation. These skills use your body to change your emotions quickly.',
        practice: 'When in crisis, try: Splash cold water on your face, do intense exercise, practice paced breathing, or tense and release muscle groups.',
        invariants: ['morphism_structure', 'instantiation']
      },
      {
        module: 'distress_tolerance',
        skill: 'accepts',
        name: 'ACCEPTS',
        content: 'ACCEPTS is a distraction skill: Activities, Contributing, Comparisons, Emotions, Pushing away, Thoughts, Sensations. Use these to temporarily distract from painful emotions.',
        practice: 'When overwhelmed, engage in activities, help others, compare to worse situations, experience different emotions, push away thoughts, use different thoughts, or engage different sensations.',
        invariants: ['morphism_structure', 'domain_connection']
      },
      {
        module: 'distress_tolerance',
        skill: 'radical_acceptance',
        name: 'Radical Acceptance',
        content: 'Radical Acceptance means completely accepting reality as it is, without fighting it or trying to change it. It is acknowledging what is true, even when it is painful.',
        practice: 'When you find yourself fighting reality, practice saying "This is what is happening right now. I accept it." Notice the difference between accepting and approving.',
        invariants: ['universal_principle', 'witness_verification']
      },

      // EMOTION REGULATION MODULE
      {
        module: 'emotion_regulation',
        skill: 'understand_emotions',
        name: 'Understanding Emotions',
        content: 'Emotions have functions. They communicate information, motivate action, and organize responses. Understanding what emotions do helps you work with them instead of against them.',
        practice: 'When you feel an emotion, ask: What is this emotion telling me? What does it want me to do? What is its function?',
        invariants: ['witness_verification', 'domain_connection']
      },
      {
        module: 'emotion_regulation',
        skill: 'opposite_action',
        name: 'Opposite Action',
        content: 'Opposite Action means acting opposite to your emotional urge when the emotion does not fit the facts or acting on it would be ineffective. It is changing your behavior to change your emotion.',
        practice: 'If you feel like withdrawing when you are sad, try reaching out. If you feel like attacking when angry, try being gentle. Act opposite to the emotion urge.',
        invariants: ['morphism_structure', 'instantiation']
      },
      {
        module: 'emotion_regulation',
        skill: 'check_facts',
        name: 'Check the Facts',
        content: 'Check the Facts means examining whether your emotional reaction fits the actual situation. Often our emotions are based on interpretations, not facts.',
        practice: 'When you have a strong emotion, ask: What are the facts? What am I assuming? What is my interpretation? Is my emotion justified by the facts?',
        invariants: ['witness_verification', 'morphism_structure']
      },
      {
        module: 'emotion_regulation',
        skill: 'problem_solving',
        name: 'Problem Solving',
        content: 'Problem Solving means finding effective solutions when your emotions fit the facts. It involves identifying the problem, brainstorming solutions, choosing a solution, and acting on it.',
        practice: 'When your emotion is justified, use problem solving: Define the problem, generate solutions, evaluate solutions, choose one, implement it, and evaluate the outcome.',
        invariants: ['morphism_structure', 'witness_verification']
      },

      // INTERPERSONAL EFFECTIVENESS MODULE
      {
        module: 'interpersonal_effectiveness',
        skill: 'dear_man',
        name: 'DEAR MAN',
        content: 'DEAR MAN is a skill for getting what you want: Describe, Express, Assert, Reinforce, stay Mindful, Appear confident, Negotiate. It helps you ask for what you need effectively.',
        practice: 'When you need something: Describe the situation, Express your feelings, Assert your request, Reinforce why it matters, stay Mindful of your goal, Appear confident, and Negotiate if needed.',
        invariants: ['morphism_structure', 'instantiation']
      },
      {
        module: 'interpersonal_effectiveness',
        skill: 'give',
        name: 'GIVE',
        content: 'GIVE is a skill for maintaining relationships: be Gentle, act Interested, Validate, use an Easy manner. It helps you keep relationships while getting what you want.',
        practice: 'When interacting: be Gentle (no attacks), act Interested (listen), Validate (acknowledge the other person), use an Easy manner (be lighthearted).',
        invariants: ['domain_connection', 'morphism_structure']
      },
      {
        module: 'interpersonal_effectiveness',
        skill: 'fast',
        name: 'FAST',
        content: 'FAST is a skill for maintaining self-respect: be Fair, no Apologies for being alive, Stick to values, be Truthful. It helps you keep your self-respect while getting what you want.',
        practice: 'When asking for something: be Fair to yourself and others, do not Apologize for having needs, Stick to your values, be Truthful.',
        invariants: ['universal_principle', 'witness_verification']
      },
      {
        module: 'interpersonal_effectiveness',
        skill: 'validation',
        name: 'Validation',
        content: 'Validation means acknowledging another person\'s thoughts, feelings, and behaviors as understandable and valid, given their history and current situation. It does not mean agreeing or approving.',
        practice: 'When someone shares something, validate by: Listening, reflecting back what you hear, acknowledging their experience, finding the kernel of truth, and showing understanding.',
        invariants: ['witness_verification', 'domain_connection']
      }
    ];
  }

  /**
   * Structure DBT skills as CE format
   */
  structureAsCE(skills, options = {}) {
    const ceCourse = {
      title: options.title || 'Dialectical Behavior Therapy Skills',
      description: 'DBT skills for emotional regulation, distress tolerance, mindfulness, and interpersonal effectiveness. Structured as learnable manifolds for experiential learning.',
      domains: []
    };

    // Group skills by module (each module becomes a domain)
    const modules = new Map();
    
    for (const skill of skills) {
      if (!modules.has(skill.module)) {
        modules.set(skill.module, {
          id: skill.module,
          name: this.formatModuleName(skill.module),
          description: this.getModuleDescription(skill.module),
          concepts: []
        });
      }

      const domain = modules.get(skill.module);
      domain.concepts.push({
        id: `${skill.module}_${skill.skill}`,
        name: skill.name,
        content: `${skill.content}\n\nPractice: ${skill.practice}`,
        invariants: skill.invariants || ['core_principle']
      });
    }

    // Convert modules to domains array
    ceCourse.domains = Array.from(modules.values());

    return ceCourse;
  }

  /**
   * Format module name for display
   */
  formatModuleName(module) {
    const names = {
      'mindfulness': 'Mindfulness',
      'distress_tolerance': 'Distress Tolerance',
      'emotion_regulation': 'Emotion Regulation',
      'interpersonal_effectiveness': 'Interpersonal Effectiveness'
    };
    return names[module] || module.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Get module description
   */
  getModuleDescription(module) {
    const descriptions = {
      'mindfulness': 'Skills for being present in the moment, observing without judgment, and participating fully in life.',
      'distress_tolerance': 'Crisis survival skills for getting through difficult situations without making things worse.',
      'emotion_regulation': 'Skills for understanding, experiencing, and changing emotions effectively.',
      'interpersonal_effectiveness': 'Skills for asking for what you want, saying no, and maintaining relationships and self-respect.'
    };
    return descriptions[module] || 'DBT skills module';
  }

  /**
   * Download from external source (placeholder for future expansion)
   */
  async downloadFromSource(source, options = {}) {
    // This could fetch from:
    // - DBT Skills Training Manual (Marsha Linehan)
    // - Online DBT resources
    // - DBT workbooks
    // - Structured DBT courses

    switch (source) {
      case 'workbook':
        return this.downloadFromWorkbook(options);
      case 'skills_manual':
        return this.downloadFromSkillsManual(options);
      case 'online_resources':
        return this.downloadFromOnlineResources(options);
      default:
        return this.getDBTSkillsStructure();
    }
  }

  /**
   * Download from workbook format
   */
  async downloadFromWorkbook(options = {}) {
    // Placeholder for workbook parsing
    // Could parse PDF, structured text, etc.
    return this.getDBTSkillsStructure();
  }

  /**
   * Download from skills manual
   */
  async downloadFromSkillsManual(options = {}) {
    // Placeholder for skills manual parsing
    return this.getDBTSkillsStructure();
  }

  /**
   * Download from online resources
   */
  async downloadFromOnlineResources(options = {}) {
    // Placeholder for online resource fetching
    // Could scrape DBT websites, fetch from APIs, etc.
    return this.getDBTSkillsStructure();
  }

  /**
   * Combine DBT with academic course for balanced learning
   */
  async combineWithCourse(dbtContent, academicCourse) {
    const combined = {
      title: `${academicCourse.title} + DBT Skills`,
      description: `Combined academic and experiential learning: ${academicCourse.description} integrated with ${dbtContent.description}`,
      domains: [
        ...academicCourse.domains,
        ...dbtContent.domains
      ]
    };

    // Add cross-domain morphisms between academic and DBT content
    // This creates connections between abstract concepts and practical skills
    const crossMorphisms = this.createCrossDomainMorphisms(
      academicCourse.domains,
      dbtContent.domains
    );

    return {
      course: combined,
      morphisms: crossMorphisms
    };
  }

  /**
   * Create morphisms between academic and DBT domains
   */
  createCrossDomainMorphisms(academicDomains, dbtDomains) {
    const morphisms = [];

    // Connect abstract concepts to practical skills
    for (const academicDomain of academicDomains) {
      for (const dbtDomain of dbtDomains) {
        // Find conceptual connections
        const connection = this.findDomainConnection(academicDomain, dbtDomain);
        if (connection) {
          morphisms.push({
            source: academicDomain.id,
            target: dbtDomain.id,
            type: 'practical_application',
            strength: connection.strength,
            description: connection.description
          });
        }
      }
    }

    return morphisms;
  }

  /**
   * Find connection between academic and DBT domains
   */
  findDomainConnection(academicDomain, dbtDomain) {
    // Simple heuristic: check for shared concepts or themes
    const academicText = academicDomain.concepts
      .map(c => c.content.toLowerCase())
      .join(' ');
    const dbtText = dbtDomain.concepts
      .map(c => c.content.toLowerCase())
      .join(' ');

    // Look for conceptual overlaps
    const academicWords = new Set(academicText.split(/\s+/));
    const dbtWords = new Set(dbtText.split(/\s+/));
    
    const intersection = new Set([...academicWords].filter(w => dbtWords.has(w)));
    const union = new Set([...academicWords, ...dbtWords]);
    
    const similarity = union.size > 0 ? intersection.size / union.size : 0;

    if (similarity > 0.1) {
      return {
        strength: similarity,
        description: `Connects ${academicDomain.name} to ${dbtDomain.name} through shared concepts`
      };
    }

    return null;
  }

  /**
   * Export DBT content as JSON
   */
  exportAsJSON(content, filename = 'dbt_skills_ce.json') {
    const json = JSON.stringify(content, null, 2);
    
    if (typeof window !== 'undefined') {
      // Browser: download as file
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // Node.js: write to file
      const fs = require('fs');
      fs.writeFileSync(filename, json);
      console.log(`💾 Saved to ${filename}`);
    }

    return content;
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DBTDownloader };
}

