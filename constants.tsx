
import React from 'react';
import { Subject, GradeLevel } from './types';

export const SUBJECTS: Subject[] = [
  { 
    id: 'arabic', 
    name: 'اللغة العربية', 
    icon: '📝', 
    description: 'القواعد، الصرف، الإملاء، البلاغة، النصوص الأدبية والتواصل الشفهي.' 
  },
  { 
    id: 'math', 
    name: 'الرياضيات', 
    icon: '📐', 
    description: 'الحساب، الهندسة، الجبر، الدوال، والإحصاء والاحتمالات.' 
  },
  { 
    id: 'physics', 
    name: 'العلوم الفيزيائية', 
    icon: '🔬', 
    description: 'الظواهر الكهربائية، الميكانيكية، الضوئية، وتحولات المادة.' 
  },
  { 
    id: 'science', 
    name: 'علوم الطبيعة والحياة', 
    icon: '🌿', 
    description: 'الإنسان والصحة، الجيولوجيا، النباتات، والظواهر الطبيعية.' 
  },
  { 
    id: 'islamic', 
    name: 'التربية الإسلامية', 
    icon: '🕌', 
    description: 'القرآن، الحديث، السيرة، الفقه والعبادات.' 
  },
  { 
    id: 'civics', 
    name: 'التربية المدنية', 
    icon: '🤝', 
    description: 'المواطنة، المؤسسات، الديمقراطية، وحقوق الإنسان.' 
  },
  { 
    id: 'history_geo', 
    name: 'التاريخ والجغرافيا', 
    icon: '🗺️', 
    description: 'تاريخ الجزائر، الحضارات، الموقع الجغرافي، والموارد.' 
  },
  { 
    id: 'french', 
    name: 'اللغة الفرنسية', 
    icon: '🇫🇷', 
    description: 'Compétences linguistiques et production écrite.' 
  },
  { 
    id: 'english', 
    name: 'اللغة الإنجليزية', 
    icon: '🇬🇧', 
    description: 'Grammar, vocabulary and communication skills.' 
  },
  { 
    id: 'amazigh', 
    name: 'اللغة الأمازيغية', 
    icon: 'ⵣ', 
    description: 'تطوير المهارات اللغوية في اللغة الأمازيغية.' 
  },
  { 
    id: 'informatics', 
    name: 'الإعلام الآلي', 
    icon: '💻', 
    description: 'الخوارزميات، البرمجة، الشبكات، والمعالجة الآلية للمعلومات.' 
  },
  { 
    id: 'philosophy', 
    name: 'الفلسفة', 
    icon: '💭', 
    description: 'المشكلات الفلسفية، المنطق، والمذاهب الفلسفية.' 
  },
  { 
    id: 'technology', 
    name: 'التكنولوجيا', 
    icon: '⚙️', 
    description: 'الأنظمة الآلية والتركيبات الأساسية (طور المتوسط).' 
  },
  { 
    id: 'economics', 
    name: 'الاقتصاد والمناجمنت', 
    icon: '📈', 
    description: 'مبادئ الاقتصاد، المؤسسة، والوظائف الإدارية.' 
  },
  { 
    id: 'accounting', 
    name: 'التسيير المحاسبي والمالي', 
    icon: '📊', 
    description: 'المحاسبة العامة، الميزانية، والتحليل المالي.' 
  },
  { 
    id: 'law', 
    name: 'القانون', 
    icon: '⚖️', 
    description: 'قانون العمل، القانون التجاري، والتشريعات الوطنية.' 
  },
  { 
    id: 'mech_eng', 
    name: 'الهندسة الميكانيكية', 
    icon: '🔧', 
    description: 'الرسم التقني، المقاومة، وآليات نقل الحركة.' 
  },
  { 
    id: 'elec_eng', 
    name: 'الهندسة الكهربائية', 
    icon: '⚡', 
    description: 'المنطق التعاقبي، المنطق التوافقي، والتركيبات الكهربائية.' 
  },
  { 
    id: 'civil_eng', 
    name: 'الهندسة المدنية', 
    icon: '🏗️', 
    description: 'حساب المنشآت، الطبوغرافيا، ومواد البناء.' 
  },
  { 
    id: 'methods_eng', 
    name: 'هندسة الطرائق', 
    icon: '🧪', 
    description: 'الكيمياء الحيوية، الكيمياء العضوية، وهندسة الكيمياء.' 
  },
  { 
    id: 'italian', 
    name: 'اللغة الإيطالية', 
    icon: '🇮🇹', 
    description: 'تعلم اللغة الإيطالية للغات الأجنبية.' 
  },
  { 
    id: 'spanish', 
    name: 'اللغة الإسبانية', 
    icon: '🇪🇸', 
    description: 'تعلم اللغة الإسبانية للغات الأجنبية.' 
  },
  { 
    id: 'german', 
    name: 'اللغة الألمانية', 
    icon: '🇩🇪', 
    description: 'تعلم اللغة الألمانية للغات الأجنبية.' 
  },
  { 
    id: 'art_edu', 
    name: 'التربية الفنية', 
    icon: '🎨', 
    description: 'الرسم، التعبير التشكيلي، وتاريخ الفن.' 
  },
  { 
    id: 'music_edu', 
    name: 'التربية الموسيقية', 
    icon: '🎵', 
    description: 'النوتة، الإيقاع، وتذوق الموسيقى.' 
  }
];

export const GRADES = Object.entries(GradeLevel).map(([key, value]) => ({
  id: key,
  label: value
}));
