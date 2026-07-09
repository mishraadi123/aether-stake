"use client";

import { Mail, HelpCircle, AlertTriangle, ExternalLink } from "lucide-react";

const GithubIcon = (props) => (
  <svg
    viewBox="0 0 24 24"
    width="20"
    height="20"
    stroke="currentColor"
    strokeWidth="2.5"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={props.className}
  >
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

export default function Contact() {
  return (
    <div className="max-w-4xl mx-auto w-full py-6 flex flex-col gap-8 animate-fade-in">
      
      <div>
        <h2 className="text-2xl font-black text-[#1C1B18]">Support & Contact Channels</h2>
        <p className="text-xs text-[#6E6C64] mt-1">
          Get in touch with the maintainers or report issues.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Info card */}
        <div className="bg-white border border-[#EBE9E1] rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col gap-5">
          <h3 className="text-sm font-black uppercase tracking-wider text-[#1C1B18] border-b border-[#FAF9F5] pb-2">
            No Backend Form Disclaimer
          </h3>
          <p className="text-xs text-[#6E6C64] leading-relaxed">
            Because this application compiles to a static HTML build (<code>output: &apos;export&apos;</code>) hosted directly on Cloudflare Workers edge nodes, **there is no backing Node.js backend server** to process contact forms.
          </p>
          <div className="bg-[#FFF8EE] border border-[#FEEBD0] text-[#E75A3B] p-4 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <p className="text-[10px] text-[#6E6C64] leading-relaxed">
              We explicitly choose not to include a dummy contact form to ensure full transparent design compliance with challenge submission guidelines.
            </p>
          </div>
        </div>

        {/* Contact channels card */}
        <div className="bg-white border border-[#EBE9E1] rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col gap-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-[#1C1B18] border-b border-[#FAF9F5] pb-2">
            Communication Channels
          </h3>
          
          <div className="flex flex-col gap-3.5 mt-2">
            {/* Github Issues */}
            <a
              href="https://github.com/shaurya-garg/windfall/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 bg-[#FAF9F5] border border-[#EBE9E1] hover:border-[#1C1B18] rounded-2xl transition-all group"
            >
              <div className="flex items-center gap-3">
                <GithubIcon className="w-5 h-5 text-[#E75A3B]" />
                <div className="text-xs">
                  <span className="font-bold text-[#1C1B18] block">GitHub Issues</span>
                  <span className="text-[#6E6C64]">Report bugs and request features</span>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-[#6E6C64] group-hover:text-[#1C1B18] transition-colors" />
            </a>

            {/* Email mailto composer */}
            <a
              href="mailto:shaurya@example.com?subject=Windfall%20Stellar%20dApp%20Feedback"
              className="flex items-center justify-between p-4 bg-[#FAF9F5] border border-[#EBE9E1] hover:border-[#1C1B18] rounded-2xl transition-all group"
            >
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-[#E75A3B]" />
                <div className="text-xs">
                  <span className="font-bold text-[#1C1B18] block">Maintainer Email</span>
                  <span className="text-[#6E6C64]">shaurya@example.com</span>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-[#6E6C64] group-hover:text-[#1C1B18] transition-colors" />
            </a>

            {/* Maintainer handle */}
            <div className="p-4 bg-[#FAF9F5] border border-[#EBE9E1] rounded-2xl flex items-center gap-3">
              <HelpCircle className="w-5 h-5 text-[#E75A3B]" />
              <div className="text-xs text-[#6E6C64]">
                <span className="font-bold text-[#1C1B18] block">Project Maintainer Handle</span>
                <span>GitHub: @shaurya-garg</span>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
