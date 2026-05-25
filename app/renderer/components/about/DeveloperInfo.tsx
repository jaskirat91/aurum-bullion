import React from 'react';
import { ArrowLeft, Mail, Phone, Code, Terminal, BrainCircuit, Globe, Award, ArrowRight } from 'lucide-react';

interface DeveloperInfoProps {
  onClose: () => void;
}

export const DeveloperInfo: React.FC<DeveloperInfoProps> = ({ onClose }) => {
  return (
    <div className="absolute inset-0 bg-background/80 backdrop-blur-xl z-[100] overflow-y-auto animate-in fade-in duration-300">
      <div className="min-h-full p-8 md:p-12 lg:p-16 flex flex-col items-center">
        {/* Back Button */}
        <div className="w-full max-w-5xl mb-12">
          <button
            onClick={onClose}
            className="group flex items-center gap-3 px-5 py-2.5 bg-surface/50 backdrop-blur border border-border/50 rounded-full text-text-muted hover:text-text hover:bg-text/[0.05] transition-all shadow-sm hover:shadow-primary/20 hover:border-primary/50"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-bold uppercase tracking-widest">Back to App</span>
          </button>
        </div>

        {/* Profile Card */}
        <div className="w-full max-w-5xl relative">
          
          {/* Decorative Gradients */}
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="relative bg-surface/80 backdrop-blur-md rounded-[2.5rem] border border-border/50 shadow-2xl p-8 md:p-16 overflow-hidden flex flex-col md:flex-row gap-16 items-center md:items-start group">
            
            {/* Hover reflection */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-text/[0.03] to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-[1500ms] ease-in-out pointer-events-none" />

            {/* Left: Avatar & Quick Info */}
            <div className="flex flex-col items-center shrink-0 w-64">
              <div className="relative w-56 h-56 rounded-[2.5rem] bg-gradient-to-br from-primary via-amber-500 to-yellow-600 p-[3px] shadow-lg shadow-primary/20 mb-8 transform group-hover:-translate-y-2 group-hover:shadow-xl group-hover:shadow-primary/30 transition-all duration-500">
                <div className="w-full h-full bg-surface rounded-[2.2rem] flex items-center justify-center overflow-hidden relative border border-border/20">
                  <div className="absolute inset-0 flex items-center justify-center text-8xl font-black text-text/[0.03] select-none">
                    JS
                  </div>
                  {/* <Code className="w-24 h-24 text-text/10 absolute bottom-4 right-4 animate-pulse duration-3000" /> */}
                  {/* <span className="text-7xl font-black bg-gradient-to-br from-text to-text/40 bg-clip-text text-transparent transform hover:scale-110 transition-transform cursor-default z-10">
                    J
                  </span> */}
                </div>
              </div>
              
              <h1 className="text-4xl font-black text-text text-center mb-3 tracking-tight drop-shadow-sm">
                Jaskirat Singh
              </h1>
              <span className="text-primary font-black tracking-[0.3em] uppercase text-[11px] mb-10 flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full border border-primary/20">
                <Terminal className="w-3.5 h-3.5" /> Engineer & Founder
              </span>

              <div className="flex flex-col gap-4 w-full">
                <a href="tel:+919888828682" className="flex items-center gap-4 bg-surface border border-border/30 p-4 rounded-2xl hover:bg-text/[0.03] hover:border-primary/50 transition-all group/contact cursor-pointer shadow-sm">
                  <div className="bg-primary/20 p-3 rounded-xl text-primary group-hover/contact:bg-primary group-hover/contact:text-white transition-colors duration-300 shadow-sm shadow-primary/20">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-text-muted uppercase tracking-widest font-bold mb-0.5">Mobile</span>
                    <span className="text-sm font-semibold text-text tracking-wider">+91 9888828682</span>
                  </div>
                </a>
                
                <a href="mailto:er.jaskiratsingh91@gmail.com" className="flex items-center gap-4 bg-surface border border-border/30 p-4 rounded-2xl hover:bg-text/[0.03] hover:border-purple-500/50 transition-all group/contact cursor-pointer overflow-hidden shadow-sm">
                  <div className="bg-purple-500/20 p-3 rounded-xl text-purple-500 group-hover/contact:bg-purple-500 group-hover/contact:text-white transition-colors duration-300 shadow-sm shadow-purple-500/20">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col truncate pr-2">
                    <span className="text-[10px] text-text-muted uppercase tracking-widest font-bold mb-0.5">Email</span>
                    <span className="text-[13px] font-semibold text-text truncate hover:overflow-visible hover:whitespace-normal">
                      er.jaskiratsingh91<br className="sm:hidden" />@gmail.com
                    </span>
                  </div>
                </a>
              </div>
            </div>

            {/* Right: Bio & Expertise */}
            <div className="flex-1 flex flex-col relative z-10 pt-4">
              
              <div className="prose prose-p:text-text-muted prose-strong:text-text max-w-none">
                <p className="text-xl md:text-2xl leading-[1.6] font-medium text-text mb-8 relative">
                  <span className="absolute -left-8 -top-6 text-7xl text-primary/20 font-serif leading-none select-none">"</span>
                  A highly experienced software engineer with <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-amber-500 font-bold drop-shadow-sm">over 13 years</span> in the industry, known for building powerful, scalable, and business-focused applications.
                </p>
                <div className="flex flex-col gap-6 text-[15px] md:text-base leading-relaxed text-text-muted/90 max-w-2xl">
                  <p>
                    He brings deep expertise in backend engineering, modern system design, and creating solutions that solve real-world problems with precision and efficiency. He has worked across diverse domains, consistently delivering high-quality systems that are reliable, performant, and tailored to business needs.
                  </p>
                  
                  <div className="relative mt-4">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-amber-500 to-transparent rounded-full" />
                    <div className="pl-6 py-2">
                      <p className="text-sm md:text-[15px] text-text/80 font-medium leading-relaxed italic m-0">
                        "Jaskirat is the sole developer and maintainer of this application, <strong className="text-primary not-italic font-black tracking-widest uppercase mr-1">Aurum Bullion</strong>, crafted specifically to simplify and elevate accounting workflows for the jewellery industry."
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Badges/Skills */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 border-t border-border/50 pt-10 mt-12">
                <div className="flex items-center gap-4 bg-surface p-3 rounded-2xl border border-border/30 hover:bg-text/[0.02] hover:border-cyan-500/30 transition-all cursor-default shadow-sm">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-cyan-500/10 text-cyan-500 shadow-inner">
                    <BrainCircuit className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest text-text">System<br/>Design</span>
                </div>
                <div className="flex items-center gap-4 bg-surface p-3 rounded-2xl border border-border/30 hover:bg-text/[0.02] hover:border-emerald-500/30 transition-all cursor-default shadow-sm">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-500/10 text-emerald-500 shadow-inner">
                    <Globe className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest text-text">Scalable<br/>Apps</span>
                </div>
                <div className="flex items-center gap-4 bg-surface p-3 rounded-2xl border border-border/30 hover:bg-text/[0.02] hover:border-amber-500/30 transition-all cursor-default shadow-sm">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-amber-500/10 text-amber-500 shadow-inner">
                    <Award className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest text-text">13+ Years<br/>Exp</span>
                </div>
              </div>

              {/* Call to action */}
              <div className="mt-12 bg-gradient-to-r from-surface to-text/[0.02] border border-border/50 rounded-2xl p-6 md:p-8 flex flex-col xl:flex-row items-center justify-between gap-8 hover:border-text/[0.05] hover:shadow-md transition-all relative overflow-hidden">
                <div className="absolute right-0 top-0 w-64 h-64 bg-primary/10 blur-[60px] rounded-full" />
                <div className="flex items-center gap-5 z-10 text-center xl:text-left">
                  <span className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 hidden md:flex mb-2 xl:mb-0 shadow-inner">
                    <Code className="w-6 h-6" />
                  </span>
                  <p className="text-sm md:text-[15px] font-medium text-text-muted m-0 max-w-lg leading-relaxed">
                    If you’re looking to transform your business with a custom-built software solution, <strong className="text-text font-bold">don’t hesitate to connect.</strong>
                  </p>
                </div>
                <a 
                  href="mailto:er.jaskiratsingh91@gmail.com" 
                  className="shrink-0 flex items-center justify-center gap-3 bg-text text-background px-8 py-4 rounded-full text-xs font-black uppercase tracking-[0.2em] hover:scale-[1.02] hover:bg-primary hover:text-white hover:shadow-lg hover:shadow-primary/30 transition-all z-10 w-full xl:w-auto"
                >
                  Start Custom Project <ArrowRight className="w-4 h-4" />
                </a>
              </div>

            </div>

          </div>
        </div>
        
        {/* Footer info text */}
        <div className="text-center mt-12 text-[10px] text-text-muted/40 uppercase tracking-[0.3em] font-bold">
          Aurum Bullion © {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
};
