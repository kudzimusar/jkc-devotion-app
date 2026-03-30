// CHURCH OS MASTER CONSTANTS
// This ensures synchronization between Member inputs and Admin analytics

export const MINISTRY_OPTIONS = [
    "Worship Ministry",
    "Choir",
    "Media / Production",
    "Ushers",
    "Hospitality",
    "Children's Ministry",
    "Youth Ministry",
    "Young Adults",
    "Intercessory Prayer Team",
    "Evangelism Team",
    "Discipleship Team",
    "Marriage Ministry",
    "Men's Ministry",
    "Women's Ministry",
    "Counseling Ministry",
    "Protocol / Security",
    "Missions Team",
    "Administration",
    "Finance Team",
    "Technical Team",
    "Translation Team",
    "Community Outreach",
    "Missions & Church Planting",
    "Creative Arts & Drama",
    "Health & Wellness",
    "Benevolence & Welfare",
    "Prison Ministry",
    "Bible Study Groups"
];

export const MINISTRIES: Record<string, string> = {
    "worship": "Worship Ministry",
    "ushers": "Ushering Ministry",
    "childrens": "Children's Ministry",
    "youth": "Youth Ministry",
    "evangelism": "Evangelism Ministry",
    "prayer": "Prayer Ministry",
    "media": "Media Ministry",
    "hospitality": "Hospitality Ministry",
    "bible_study": "Bible Study Groups",
    "finance": "Finance Ministry",
    "missions": "Missions Ministry",
    "pastoral": "Pastoral Care"
};

export const SKILL_OPTIONS = [
    "Music (Instruments)",
    "Vocals",
    "Teaching",
    "Technology",
    "Video Editing",
    "Graphic Design",
    "Counseling",
    "Administration",
    "Finance",
    "Writing",
    "Translation (JP/EN)",
    "Event Planning",
    "Evangelism",
    "Prayer / Intercession",
    "Leadership",
    "Youth Mentoring",
    "Children Ministry",
    "Hospitality",
    "Culinary Arts",
    "Medical / Nursing",
    "Legal Advice",
    "Construction / DIY",
    "Social Media Mgmt",
    "Photography",
    "Web Development"
];

export const PRAYER_CATEGORIES = [
    "Health",
    "Marriage",
    "Family",
    "Financial",
    "Career",
    "Immigration",
    "Education",
    "Spiritual Warfare",
    "Emotional Distress",
    "Salvation",
    "Other"
];

// GAP Analysis Ministries (Used in Admin Dashboard to detect staffing needs)
export const CRITICAL_MINISTRIES = [
    "Children's Ministry",
    "Counseling Ministry",
    "Evangelism Team",
    "Missions Team",
    "Intercessory Prayer Team",
    "Technical Team",
    "Health & Wellness",
    "Benevolence & Welfare"
];

export { JKC_ORG_ID } from "./org-resolver";
