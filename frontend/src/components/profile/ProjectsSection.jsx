import React from 'react';
import { Github, ExternalLink, Box } from 'lucide-react';

const ProjectsSection = ({ isEditing, profile, formData, onItemsChange }) => {
    // Since we don't have projects in Schema, we'll suggest using a Portfolio URL
    // but the UI will show how projects WOULD look.
    const mockProjects = [
        {
            title: 'E-Commerce Platform',
            description: 'Full-featured online marketplace with payment integration, real-time inventory, and admin dashboard. Built for 50k+ daily active users.',
            tags: ['React', 'Node.js', 'MongoDB', 'Stripe', 'AWS'],
            github: '#',
            demo: '#'
        },
        {
            title: 'Task Management System',
            description: 'Collaborative project management tool with real-time updates, kanban boards, and team analytics.',
            tags: ['React', 'TypeScript', 'Firebase', 'Tailwind CSS'],
            github: '#',
            demo: '#'
        }
    ];

    if (isEditing) {
        return (
            <div className="space-y-6">
                <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 mb-6">
                    <p className="text-sm font-bold text-amber-800 mb-1">Coming Soon!</p>
                    <p className="text-xs font-semibold text-amber-700">Detailed project management is being integrated. For now, please add your portfolio link in the contact section.</p>
                </div>

                <div className="space-y-4 opacity-50 pointer-events-none">
                    {mockProjects.map((p, i) => (
                        <div key={i} className="p-6 border border-gray-100 rounded-2xl bg-gray-50">
                            <h4 className="font-bold text-gray-900 mb-2">{p.title}</h4>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {mockProjects.map((project, idx) => (
                <div key={idx} className="group border-b border-gray-50 last:border-0 pb-8 last:pb-0">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
                                <Box size={20} />
                            </div>
                            <h4 className="text-lg font-bold text-gray-900 group-hover:text-[#2D9B82] transition-colors">
                                {project.title}
                            </h4>
                        </div>
                        <div className="flex gap-4">
                            <a href={project.github} className="text-gray-400 hover:text-gray-900 transition-colors flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest">
                                <Github size={14} />
                                GitHub
                            </a>
                            <a href={project.demo} className="text-[#2D9B82] hover:text-[#25836d] transition-colors flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest">
                                <ExternalLink size={14} />
                                Live Demo
                            </a>
                        </div>
                    </div>

                    <p className="text-sm text-gray-500 font-medium mb-6 leading-relaxed max-w-3xl">
                        {project.description}
                    </p>

                    <div className="flex flex-wrap gap-2">
                        {project.tags.map(tag => (
                            <span key={tag} className="px-3 py-1 bg-gray-50 text-gray-500 text-[10px] font-black uppercase tracking-tighter rounded-lg border border-gray-100">
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ProjectsSection;
