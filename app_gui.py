"""
Startup India OS — Unified Desktop Intelligence Terminal
==========================================================
All-in-One Python GUI combining:
1. 🏛️ Central Schemes Intelligence Engine (69 Central Programs)
2. 🏢 State & UT Policies (320+ Sub-National Incentives)
3. 🧭 Interactive Scheme Finder Wizard (5-Step Grant Matcher)
4. ⚖️ Side-by-Side Scheme Comparison Tool
5. 🔬 220+ Incubators & Accelerators Hub
6. ⚡ 10-Section Knowledge Stack Manager & Gap Auditor
7. 🤖 19 AI Execution Prompts (1-Click Clipboard Engine)
8. 🧮 Unit Economics & Indian Tax (GST/TDS) Runway Simulator
9. 📝 10 Actionable Founder Worksheets
10. 🌐 Live HTML Documentation & 3D Walkable Map Controller
11. 🌓 Dynamic Dark Mode (Full OLED Pitch Black) & Light Mode

Author: Aayush Rajaji <https://github.com/Aayush-Rajaji>
License: MIT
"""

import os
import sys
import json
import subprocess
import webbrowser
import platform
import multiprocessing
import http.server
import socketserver
import threading
import tkinter as tk
from tkinter import ttk, messagebox
import customtkinter as ctk

# Default Appearance: Full Black OLED
ctk.set_appearance_mode("Dark")
ctk.set_default_color_theme("blue")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
STACK_DIR = os.path.join(BASE_DIR, "stack")
PROMPTS_DIR = os.path.join(BASE_DIR, "prompts")
WORKSHEETS_DIR = os.path.join(BASE_DIR, "worksheets")
DOCS_DIR = os.path.join(BASE_DIR, "docs")

# Palette tokens
THEMES = {
    "dark": {
        "bg": "#000000",
        "surface": "#08080C",
        "surface_alt": "#101018",
        "surface_card": "#0D0D14",
        "sidebar": "#030306",
        "border": "#1A1A24",
        "text": "#F8FAFC",
        "text_muted": "#94A3B8",
        "text_faint": "#64748B",
        "primary": "#38BDF8",
        "accent": "#F59E0B",
        "accent_hover": "#D97706",
        "success": "#10B981",
        "danger": "#EF4444"
    },
    "light": {
        "bg": "#F8FAFC",
        "surface": "#FFFFFF",
        "surface_alt": "#F1F5F9",
        "surface_card": "#FFFFFF",
        "sidebar": "#EAEEF4",
        "border": "#CBD5E1",
        "text": "#0F172A",
        "text_muted": "#475569",
        "text_faint": "#64748B",
        "primary": "#0284C7",
        "accent": "#D97706",
        "accent_hover": "#B45309",
        "success": "#059669",
        "danger": "#DC2626"
    }
}

# Safe JSON Loader
def load_json(filename):
    p = os.path.join(DATA_DIR, filename)
    if os.path.exists(p):
        try:
            with open(p, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading {filename}: {e}")
    return None

SCHEMES_DATA = load_json("schemes.json") or {"schemes": []}
SCHEMES_LIST = SCHEMES_DATA.get("schemes", [])

STATE_SCHEMES_DATA = load_json("state-schemes.json") or {"states": []}
STATE_LIST = STATE_SCHEMES_DATA.get("states", [])

INCUBATORS_DATA = load_json("incubators.json") or {"incubators": []}
INCUBATORS_LIST = INCUBATORS_DATA.get("incubators", [])


class StartupIndiaApp(ctk.CTk):
    def __init__(self):
        super().__init__()

        self.current_theme = "dark"
        self.title("Bharat Startup OS — Desktop Intelligence Terminal")
        self.geometry("1280x850")
        self.minsize(1100, 720)

        self.grid_columnconfigure(1, weight=1)
        self.grid_rowconfigure(1, weight=1)

        self._init_theme_colors()
        self._setup_header()
        self._setup_sidebar()
        self._setup_main_area()
        self._setup_footer()

        # Start Local Server on Demand for embedded tools
        self.local_server_port = 8088
        self._start_local_http_server()

        # Default Tab
        self.show_schemes_tab()

    def _init_theme_colors(self):
        self.colors = THEMES[self.current_theme]
        self.configure(fg_color=self.colors["bg"])

    def _toggle_theme(self):
        self.current_theme = "light" if self.current_theme == "dark" else "dark"
        ctk.set_appearance_mode("Light" if self.current_theme == "light" else "Dark")
        self._init_theme_colors()

        # Re-render active frame
        self._setup_header()
        self._setup_sidebar()
        self._setup_footer()
        if hasattr(self, "active_tab_fn"):
            self.active_tab_fn()

    def _start_local_http_server(self):
        import functools
        def serve():
            try:
                handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=DOCS_DIR)
                with socketserver.TCPServer(("", self.local_server_port), handler) as httpd:
                    httpd.serve_forever()
            except Exception:
                pass
        t = threading.Thread(target=serve, daemon=True)
        t.start()

    # -------------------------------------------------------------
    # HEADER & FOOTER
    # -------------------------------------------------------------
    def _setup_header(self):
        if hasattr(self, "header_frame"):
            self.header_frame.destroy()

        self.header_frame = ctk.CTkFrame(self, height=64, corner_radius=0, fg_color=self.colors["surface"])
        self.header_frame.grid(row=0, column=0, columnspan=2, sticky="nsew", padx=0, pady=0)
        self.header_frame.grid_columnconfigure(1, weight=1)

        # Brand Title
        brand_frame = ctk.CTkFrame(self.header_frame, fg_color="transparent")
        brand_frame.grid(row=0, column=0, padx=20, pady=12, sticky="w")

        brand_lbl = ctk.CTkLabel(
            brand_frame, text="🇮🇳 Bharat Startup OS",
            font=ctk.CTkFont(family="Newsreader", size=22, weight="bold"),
            text_color=self.colors["text"]
        )
        brand_lbl.pack(side="left")

        sub_lbl = ctk.CTkLabel(
            brand_frame, text=" · Desktop Terminal",
            font=ctk.CTkFont(size=13),
            text_color=self.colors["text_muted"]
        )
        sub_lbl.pack(side="left", padx=4)

        # Permanent Hardware Invariant Spec Badge
        cpu_cores = multiprocessing.cpu_count()
        os_name = platform.system()
        spec_text = f"⚡ {os_name} ({cpu_cores}-Core) | OLED BLACK | [Nodes: 157]"

        self.spec_badge = ctk.CTkLabel(
            self.header_frame,
            text=spec_text,
            font=ctk.CTkFont(family="Consolas", size=11, weight="bold"),
            text_color=self.colors["primary"],
            fg_color=self.colors["surface_alt"],
            corner_radius=12,
            padx=12,
            pady=4
        )
        self.spec_badge.grid(row=0, column=1, padx=20, pady=12, sticky="e")

        # Theme Toggle Button
        theme_icon = "☀️ Light" if self.current_theme == "dark" else "🌙 OLED Black"
        self.theme_btn = ctk.CTkButton(
            self.header_frame,
            text=theme_icon,
            width=100, height=32,
            fg_color=self.colors["surface_alt"],
            hover_color=self.colors["border"],
            text_color=self.colors["text"],
            font=ctk.CTkFont(size=12, weight="bold"),
            command=self._toggle_theme
        )
        self.theme_btn.grid(row=0, column=2, padx=(0, 20), pady=12, sticky="e")

    def _setup_sidebar(self):
        if hasattr(self, "sidebar_frame"):
            self.sidebar_frame.destroy()

        self.sidebar_frame = ctk.CTkFrame(self, width=250, corner_radius=0, fg_color=self.colors["sidebar"])
        self.sidebar_frame.grid(row=1, column=0, sticky="nsew", padx=0, pady=0)
        self.sidebar_frame.grid_rowconfigure(12, weight=1)

        def add_nav_btn(text, cmd, row):
            btn = ctk.CTkButton(
                self.sidebar_frame, text=text, anchor="w",
                fg_color="transparent", text_color=self.colors["text"],
                hover_color=self.colors["surface_alt"],
                font=ctk.CTkFont(size=12, weight="bold"),
                command=cmd
            )
            btn.grid(row=row, column=0, padx=10, pady=3, sticky="ew")
            return btn

        # Section 1: Schemes & Ecosystem
        s1 = ctk.CTkLabel(self.sidebar_frame, text="🏛️ SCHEMES & ECOSYSTEM", font=ctk.CTkFont(size=10, weight="bold"), text_color=self.colors["text_faint"])
        s1.grid(row=0, column=0, padx=16, pady=(16, 4), sticky="w")

        self.btn_schemes = add_nav_btn("📋 69 Central Schemes", self.show_schemes_tab, 1)
        self.btn_finder = add_nav_btn("🧭 Scheme Finder Wizard", self.show_finder_tab, 2)
        self.btn_compare = add_nav_btn("⚖️ Compare Schemes", self.show_compare_tab, 3)
        self.btn_states = add_nav_btn("🏢 320+ State Policies", self.show_states_tab, 4)
        self.btn_incubators = add_nav_btn("🔬 220+ Incubators Map", self.show_incubators_tab, 5)

        # Section 2: Founder Stack & AI
        s2 = ctk.CTkLabel(self.sidebar_frame, text="⚡ FOUNDER OS & PROMPTS", font=ctk.CTkFont(size=10, weight="bold"), text_color=self.colors["text_faint"])
        s2.grid(row=6, column=0, padx=16, pady=(16, 4), sticky="w")

        self.btn_stack = add_nav_btn("📁 Knowledge Stack (01-10)", self.show_stack_tab, 7)
        self.btn_prompts = add_nav_btn("🤖 19 AI Execution Prompts", self.show_prompts_tab, 8)
        self.btn_calc = add_nav_btn("🧮 Unit Economics & Runway", self.show_calc_tab, 9)
        self.btn_worksheets = add_nav_btn("📝 10 Founder Worksheets", self.show_worksheets_tab, 10)

        # Quick Actions
        s3 = ctk.CTkLabel(self.sidebar_frame, text="🌐 WEB & 3D CONTROLS", font=ctk.CTkFont(size=10, weight="bold"), text_color=self.colors["text_faint"])
        s3.grid(row=11, column=0, padx=16, pady=(16, 4), sticky="w")

        self.btn_launch_web = ctk.CTkButton(
            self.sidebar_frame, text="🗺️ Open 3D Map & Web App",
            fg_color=self.colors["accent"], hover_color=self.colors["accent_hover"],
            text_color="#FFFFFF", font=ctk.CTkFont(size=12, weight="bold"),
            command=self.launch_web_app
        )
        self.btn_launch_web.grid(row=12, column=0, padx=10, pady=4, sticky="ew")

        self.btn_rebuild = ctk.CTkButton(
            self.sidebar_frame, text="⚙️ Rebuild Static Docs (Node)",
            fg_color=self.colors["surface_alt"], hover_color=self.colors["border"],
            text_color=self.colors["text"], font=ctk.CTkFont(size=11),
            command=self.rebuild_site
        )
        self.btn_rebuild.grid(row=13, column=0, padx=10, pady=(4, 16), sticky="ew")

    def _setup_main_area(self):
        if hasattr(self, "main_container"):
            self.main_container.destroy()

        self.main_container = ctk.CTkFrame(self, corner_radius=0, fg_color=self.colors["bg"])
        self.main_container.grid(row=1, column=1, sticky="nsew", padx=0, pady=0)
        self.main_container.grid_columnconfigure(0, weight=1)
        self.main_container.grid_rowconfigure(0, weight=1)

    def _setup_footer(self):
        if hasattr(self, "footer_frame"):
            self.footer_frame.destroy()

        self.footer_frame = ctk.CTkFrame(self, height=36, corner_radius=0, fg_color=self.colors["surface"])
        self.footer_frame.grid(row=2, column=0, columnspan=2, sticky="nsew", padx=0, pady=0)
        self.footer_frame.grid_columnconfigure(1, weight=1)

        credit = ctk.CTkLabel(
            self.footer_frame,
            text="🌐 Greston Global Financial Intelligence Desk | Built & Maintained by Aayush Rajaji | MIT License",
            font=ctk.CTkFont(size=11),
            text_color=self.colors["text_muted"]
        )
        credit.grid(row=0, column=0, padx=20, pady=6, sticky="w")

        links = ctk.CTkFrame(self.footer_frame, fg_color="transparent")
        links.grid(row=0, column=2, padx=20, pady=6, sticky="e")

        ctk.CTkButton(
            links, text="GitHub", width=60, height=22,
            fg_color="transparent", text_color=self.colors["primary"],
            hover_color=self.colors["surface_alt"], font=ctk.CTkFont(size=11),
            command=lambda: webbrowser.open("https://github.com/Aayush-Rajaji")
        ).pack(side="left", padx=2)

        ctk.CTkButton(
            links, text="LinkedIn", width=60, height=22,
            fg_color="transparent", text_color=self.colors["primary"],
            hover_color=self.colors["surface_alt"], font=ctk.CTkFont(size=11),
            command=lambda: webbrowser.open("https://www.linkedin.com/in/aayushrajaji/")
        ).pack(side="left", padx=2)

    def _clear_main(self):
        for w in self.main_container.winfo_children():
            w.destroy()

    def _highlight_nav(self, active_btn):
        all_btns = [
            self.btn_schemes, self.btn_finder, self.btn_compare, self.btn_states,
            self.btn_incubators, self.btn_stack, self.btn_prompts, self.btn_calc, self.btn_worksheets
        ]
        for b in all_btns:
            if b == active_btn:
                b.configure(fg_color="#2563EB", text_color="#FFFFFF")
            else:
                b.configure(fg_color="transparent", text_color=self.colors["text"])

    # -------------------------------------------------------------
    # 1. CENTRAL SCHEMES EXPLORER
    # -------------------------------------------------------------
    def show_schemes_tab(self):
        self.active_tab_fn = self.show_schemes_tab
        self._clear_main()
        self._highlight_nav(self.btn_schemes)

        frame = ctk.CTkFrame(self.main_container, fg_color="transparent")
        frame.pack(fill="both", expand=True, padx=20, pady=16)

        # Header
        h = ctk.CTkFrame(frame, fg_color="transparent")
        h.pack(fill="x", pady=(0, 10))
        ctk.CTkLabel(h, text="📋 69 Central Government Schemes", font=ctk.CTkFont(family="Newsreader", size=22, weight="bold"), text_color=self.colors["text"]).pack(side="left")
        ctk.CTkLabel(h, text="Part A (30 Deep Dives) + Part B (39 Briefs)", font=ctk.CTkFont(size=11, weight="bold"), text_color=self.colors["success"], fg_color=self.colors["surface_alt"], corner_radius=10, padx=10, pady=4).pack(side="right")

        # Toolbar
        tb = ctk.CTkFrame(frame, fg_color=self.colors["surface"], corner_radius=8)
        tb.pack(fill="x", pady=(0, 10))

        self.scheme_search_var = tk.StringVar()
        self.scheme_search_var.trace("w", lambda *args: self._render_scheme_list())
        ctk.CTkEntry(tb, placeholder_text="Filter schemes by name, ministry, keyword…", textvariable=self.scheme_search_var, width=380, height=36, fg_color=self.colors["surface_alt"], border_color=self.colors["border"]).pack(side="left", padx=10, pady=8)

        self.cat_filter_var = tk.StringVar(value="All Categories")
        ctk.CTkOptionMenu(tb, values=["All Categories", "Grant", "Equity", "Loan / Credit", "Incubation", "Market Access"], variable=self.cat_filter_var, command=lambda v: self._render_scheme_list(), width=140, height=36, fg_color=self.colors["surface_alt"], button_color=self.colors["border"]).pack(side="left", padx=6, pady=8)

        # Split List & Detail
        split = ctk.CTkFrame(frame, fg_color="transparent")
        split.pack(fill="both", expand=True)
        split.grid_columnconfigure(0, weight=4)
        split.grid_columnconfigure(1, weight=6)
        split.grid_rowconfigure(0, weight=1)

        self.scheme_list_scroll = ctk.CTkScrollableFrame(split, fg_color=self.colors["surface"], corner_radius=8)
        self.scheme_list_scroll.grid(row=0, column=0, sticky="nsew", padx=(0, 10))

        self.scheme_detail_frame = ctk.CTkScrollableFrame(split, fg_color=self.colors["surface_alt"], corner_radius=8)
        self.scheme_detail_frame.grid(row=0, column=1, sticky="nsew")

        self._render_scheme_list()

    def _render_scheme_list(self):
        for w in self.scheme_list_scroll.winfo_children():
            w.destroy()

        q = self.scheme_search_var.get().lower().strip()
        cat = self.cat_filter_var.get()
        cat_map = {"Grant": "grant", "Equity": "equity", "Loan / Credit": "loan-credit", "Incubation": "incubation", "Market Access": "market-access"}

        matched = []
        for s in SCHEMES_LIST:
            if cat != "All Categories" and s.get("category") != cat_map.get(cat, ""):
                continue
            txt = f"{s.get('name', '')} {s.get('ministry', '')} {s.get('tagline', '')}".lower()
            if not q or q in txt:
                matched.append(s)

        if not matched:
            ctk.CTkLabel(self.scheme_list_scroll, text="No matching schemes found.", text_color=self.colors["text_muted"]).pack(pady=30)
            return

        for s in matched:
            card = ctk.CTkFrame(self.scheme_list_scroll, fg_color=self.colors["surface_card"], corner_radius=6)
            card.pack(fill="x", padx=4, pady=4)

            top = ctk.CTkFrame(card, fg_color="transparent")
            top.pack(fill="x", padx=10, pady=(6, 2))
            ctk.CTkLabel(top, text=f"Part {s.get('part', 'A')}", font=ctk.CTkFont(size=10, weight="bold"), text_color=self.colors["text_faint"]).pack(side="left")
            ctk.CTkLabel(top, text=s.get("category", "").upper(), font=ctk.CTkFont(size=10, weight="bold"), text_color=self.colors["accent"]).pack(side="right")

            btn = ctk.CTkButton(
                card, text=s.get("name", ""), anchor="w",
                font=ctk.CTkFont(size=13, weight="bold"),
                fg_color="transparent", hover_color=self.colors["surface_alt"],
                text_color=self.colors["text"],
                command=lambda item=s: self._show_scheme_detail(item)
            )
            btn.pack(fill="x", padx=6, pady=2)
            ctk.CTkLabel(card, text=s.get("ministry", ""), font=ctk.CTkFont(size=11), text_color=self.colors["text_muted"], anchor="w").pack(fill="x", padx=10, pady=(0, 6))

        if matched:
            self._show_scheme_detail(matched[0])

    def _show_scheme_detail(self, s):
        for w in self.scheme_detail_frame.winfo_children():
            w.destroy()

        ctk.CTkLabel(self.scheme_detail_frame, text=f"{s.get('ministry', '')} · Part {s.get('part', 'A')} · Page {s.get('page', '')}", font=ctk.CTkFont(size=11, weight="bold"), text_color=self.colors["primary"]).pack(anchor="w", padx=16, pady=(16, 2))
        ctk.CTkLabel(self.scheme_detail_frame, text=s.get("name", ""), font=ctk.CTkFont(family="Newsreader", size=20, weight="bold"), text_color=self.colors["text"], wraplength=520, justify="left").pack(anchor="w", padx=16, pady=2)
        ctk.CTkLabel(self.scheme_detail_frame, text=s.get("tagline", ""), font=ctk.CTkFont(size=13), text_color=self.colors["text_muted"], wraplength=520, justify="left").pack(anchor="w", padx=16, pady=(2, 10))

        if s.get("maxFunding"):
            box = ctk.CTkFrame(self.scheme_detail_frame, fg_color="#064E3B", corner_radius=6)
            box.pack(fill="x", padx=16, pady=6)
            ctk.CTkLabel(box, text=f"💰 Max Funding: {s.get('maxFunding')}", font=ctk.CTkFont(size=13, weight="bold"), text_color="#34D399").pack(padx=12, pady=8, anchor="w")

        ctk.CTkLabel(self.scheme_detail_frame, text="Key Benefits & Funding Instrument", font=ctk.CTkFont(size=14, weight="bold"), text_color=self.colors["text"]).pack(anchor="w", padx=16, pady=(12, 4))
        for b in s.get("benefits", []):
            ctk.CTkLabel(self.scheme_detail_frame, text=f"• {b}", font=ctk.CTkFont(size=12), text_color=self.colors["text"], wraplength=500, justify="left").pack(anchor="w", padx=20, pady=2)

        ctk.CTkLabel(self.scheme_detail_frame, text="Eligibility Criteria", font=ctk.CTkFont(size=14, weight="bold"), text_color=self.colors["text"]).pack(anchor="w", padx=16, pady=(12, 4))
        for e in s.get("eligibility", []):
            ctk.CTkLabel(self.scheme_detail_frame, text=f"✓ {e}", font=ctk.CTkFont(size=12), text_color=self.colors["text"], wraplength=500, justify="left").pack(anchor="w", padx=20, pady=2)

        act = ctk.CTkFrame(self.scheme_detail_frame, fg_color="transparent")
        act.pack(fill="x", padx=16, pady=16)

        if s.get("portalUrl"):
            ctk.CTkButton(act, text="Open Portal ↗", fg_color=self.colors["accent"], hover_color=self.colors["accent_hover"], command=lambda u=s.get("portalUrl"): webbrowser.open(u)).pack(side="left", padx=(0, 10))
        ctk.CTkButton(act, text="Open Local HTML", fg_color=self.colors["surface"], hover_color=self.colors["border"], command=lambda slug=s.get("slug"): webbrowser.open(f"file:///{os.path.join(DOCS_DIR, 'schemes', f'{slug}.html')}")).pack(side="left")

    # -------------------------------------------------------------
    # 2. SCHEME FINDER WIZARD
    # -------------------------------------------------------------
    def show_finder_tab(self):
        self.active_tab_fn = self.show_finder_tab
        self._clear_main()
        self._highlight_nav(self.btn_finder)

        frame = ctk.CTkFrame(self.main_container, fg_color="transparent")
        frame.pack(fill="both", expand=True, padx=20, pady=16)

        ctk.CTkLabel(frame, text="🧭 Scheme Finder Wizard", font=ctk.CTkFont(family="Newsreader", size=22, weight="bold"), text_color=self.colors["text"]).pack(anchor="w", pady=(0, 4))
        ctk.CTkLabel(frame, text="Answer 3 quick questions to discover your matching central and state funding programs.", font=ctk.CTkFont(size=13), text_color=self.colors["text_muted"]).pack(anchor="w", pady=(0, 16))

        box = ctk.CTkFrame(frame, fg_color=self.colors["surface"], corner_radius=8)
        box.pack(fill="x", padx=0, pady=(0, 16))

        # Q1: Stage
        ctk.CTkLabel(box, text="1. What is your startup's development stage?", font=ctk.CTkFont(size=13, weight="bold"), text_color=self.colors["text"]).pack(anchor="w", padx=16, pady=(12, 4))
        self.finder_stage = tk.StringVar(value="ideation")
        stage_row = ctk.CTkFrame(box, fg_color="transparent")
        stage_row.pack(fill="x", padx=16, pady=4)
        for val, lbl in [("ideation", "Ideation / Concept"), ("validation", "PoC / Prototype"), ("seed", "Seed / Early Revenue"), ("scaling", "Growth / Scale")]:
            ctk.CTkRadioButton(stage_row, text=lbl, variable=self.finder_stage, value=val).pack(side="left", padx=8)

        # Q2: Sector
        ctk.CTkLabel(box, text="2. What is your primary industry vertical?", font=ctk.CTkFont(size=13, weight="bold"), text_color=self.colors["text"]).pack(anchor="w", padx=16, pady=(12, 4))
        self.finder_sector = tk.StringVar(value="general")
        sec_row = ctk.CTkFrame(box, fg_color="transparent")
        sec_row.pack(fill="x", padx=16, pady=4)
        for val, lbl in [("general", "Sector Agnostic / Software"), ("deeptech", "DeepTech / AI / Semicon"), ("biotech", "Biotech / MedTech"), ("defence", "Defence / Aerospace")]:
            ctk.CTkRadioButton(sec_row, text=lbl, variable=self.finder_sector, value=val).pack(side="left", padx=8)

        # Q3: Support Type
        ctk.CTkLabel(box, text="3. What type of capital or support are you seeking?", font=ctk.CTkFont(size=13, weight="bold"), text_color=self.colors["text"]).pack(anchor="w", padx=16, pady=(12, 4))
        self.finder_need = tk.StringVar(value="grant")
        need_row = ctk.CTkFrame(box, fg_color="transparent")
        need_row.pack(fill="x", padx=16, pady=(4, 16))
        for val, lbl in [("grant", "Non-Dilutive Grant"), ("equity", "Seed / Equity"), ("loan-credit", "Subsidized Loan / CGSS"), ("incubation", "Incubation / Lab Access")]:
            ctk.CTkRadioButton(need_row, text=lbl, variable=self.finder_need, value=val).pack(side="left", padx=8)

        # Match Button
        ctk.CTkButton(box, text="🔍 Match Eligible Schemes", font=ctk.CTkFont(size=13, weight="bold"), fg_color=self.colors["accent"], hover_color=self.colors["accent_hover"], command=self._run_finder_match).pack(anchor="w", padx=16, pady=(0, 16))

        # Results area
        self.finder_results_scroll = ctk.CTkScrollableFrame(frame, fg_color=self.colors["surface_alt"], corner_radius=8)
        self.finder_results_scroll.pack(fill="both", expand=True)

        self._run_finder_match()

    def _run_finder_match(self):
        for w in self.finder_results_scroll.winfo_children():
            w.destroy()

        stage = self.finder_stage.get()
        sector = self.finder_sector.get()
        need = self.finder_need.get()

        matches = []
        for s in SCHEMES_LIST:
            cat_match = (s.get("category") == need) or (need == "grant" and s.get("category") in ["grant", "mixed"])
            stage_match = stage in s.get("stages", []) or not s.get("stages")
            sec_match = sector in s.get("sectors", []) or "general" in s.get("sectors", []) or not s.get("sectors")
            if cat_match and (stage_match or sec_match):
                matches.append(s)

        ctk.CTkLabel(self.finder_results_scroll, text=f"🎯 {len(matches)} Matching Programs Found", font=ctk.CTkFont(size=15, weight="bold"), text_color=self.colors["primary"]).pack(anchor="w", padx=12, pady=(10, 6))

        for s in matches:
            card = ctk.CTkFrame(self.finder_results_scroll, fg_color=self.colors["surface_card"], corner_radius=6)
            card.pack(fill="x", padx=8, pady=4)
            ctk.CTkLabel(card, text=s.get("name", ""), font=ctk.CTkFont(size=14, weight="bold"), text_color=self.colors["text"]).pack(anchor="w", padx=12, pady=(8, 2))
            ctk.CTkLabel(card, text=f"{s.get('ministry', '')} · Max Funding: {s.get('maxFunding', 'Varies')}", font=ctk.CTkFont(size=11), text_color=self.colors["accent"]).pack(anchor="w", padx=12, pady=(0, 4))
            ctk.CTkLabel(card, text=s.get("tagline", ""), font=ctk.CTkFont(size=12), text_color=self.colors["text_muted"]).pack(anchor="w", padx=12, pady=(0, 8))

    # -------------------------------------------------------------
    # 3. COMPARE SCHEMES
    # -------------------------------------------------------------
    def show_compare_tab(self):
        self.active_tab_fn = self.show_compare_tab
        self._clear_main()
        self._highlight_nav(self.btn_compare)

        frame = ctk.CTkFrame(self.main_container, fg_color="transparent")
        frame.pack(fill="both", expand=True, padx=20, pady=16)

        ctk.CTkLabel(frame, text="⚖️ Side-by-Side Scheme Compare", font=ctk.CTkFont(family="Newsreader", size=22, weight="bold"), text_color=self.colors["text"]).pack(anchor="w", pady=(0, 10))

        selectors = ctk.CTkFrame(frame, fg_color=self.colors["surface"], corner_radius=8)
        selectors.pack(fill="x", pady=(0, 14))

        names = [s.get("name") for s in SCHEMES_LIST]
        self.comp_s1 = tk.StringVar(value=names[0] if len(names) > 0 else "")
        self.comp_s2 = tk.StringVar(value=names[1] if len(names) > 1 else "")

        ctk.CTkLabel(selectors, text="Scheme 1:", font=ctk.CTkFont(size=12, weight="bold"), text_color=self.colors["text"]).pack(side="left", padx=(14, 4), pady=10)
        ctk.CTkOptionMenu(selectors, values=names, variable=self.comp_s1, command=lambda v: self._render_compare_table(), width=240, fg_color=self.colors["surface_alt"]).pack(side="left", padx=4, pady=10)

        ctk.CTkLabel(selectors, text="Scheme 2:", font=ctk.CTkFont(size=12, weight="bold"), text_color=self.colors["text"]).pack(side="left", padx=(20, 4), pady=10)
        ctk.CTkOptionMenu(selectors, values=names, variable=self.comp_s2, command=lambda v: self._render_compare_table(), width=240, fg_color=self.colors["surface_alt"]).pack(side="left", padx=4, pady=10)

        self.compare_scroll = ctk.CTkScrollableFrame(frame, fg_color=self.colors["surface_alt"], corner_radius=8)
        self.compare_scroll.pack(fill="both", expand=True)

        self._render_compare_table()

    def _render_compare_table(self):
        for w in self.compare_scroll.winfo_children():
            w.destroy()

        s1_name = self.comp_s1.get()
        s2_name = self.comp_s2.get()

        s1 = next((s for s in SCHEMES_LIST if s.get("name") == s1_name), {})
        s2 = next((s for s in SCHEMES_LIST if s.get("name") == s2_name), {})

        fields = [
            ("Ministry / Department", s1.get("ministry", ""), s2.get("ministry", "")),
            ("Support Category", s1.get("category", "").upper(), s2.get("category", "").upper()),
            ("Max Funding Ceiling", s1.get("maxFunding", "Varies"), s2.get("maxFunding", "Varies")),
            ("Target Stages", ", ".join(s1.get("stages", [])), ", ".join(s2.get("stages", []))),
            ("Summary / Objective", s1.get("tagline", ""), s2.get("tagline", ""))
        ]

        for label, v1, v2 in fields:
            row = ctk.CTkFrame(self.compare_scroll, fg_color=self.colors["surface_card"], corner_radius=6)
            row.pack(fill="x", padx=6, pady=4)
            row.grid_columnconfigure(0, weight=3)
            row.grid_columnconfigure(1, weight=4)
            row.grid_columnconfigure(2, weight=4)

            ctk.CTkLabel(row, text=label, font=ctk.CTkFont(size=12, weight="bold"), text_color=self.colors["primary"]).grid(row=0, column=0, padx=12, pady=10, sticky="w")
            ctk.CTkLabel(row, text=v1, font=ctk.CTkFont(size=12), text_color=self.colors["text"], wraplength=280, justify="left").grid(row=0, column=1, padx=12, pady=10, sticky="w")
            ctk.CTkLabel(row, text=v2, font=ctk.CTkFont(size=12), text_color=self.colors["text"], wraplength=280, justify="left").grid(row=0, column=2, padx=12, pady=10, sticky="w")

    # -------------------------------------------------------------
    # 4. STATE SCHEMES & 5. INCUBATORS
    # -------------------------------------------------------------
    def show_states_tab(self):
        self.active_tab_fn = self.show_states_tab
        self._clear_main()
        self._highlight_nav(self.btn_states)

        frame = ctk.CTkFrame(self.main_container, fg_color="transparent")
        frame.pack(fill="both", expand=True, padx=20, pady=16)

        ctk.CTkLabel(frame, text="🏢 320+ State & UT Startup Policies", font=ctk.CTkFont(family="Newsreader", size=22, weight="bold"), text_color=self.colors["text"]).pack(anchor="w", pady=(0, 10))

        scroll = ctk.CTkScrollableFrame(frame, fg_color=self.colors["surface_alt"], corner_radius=8)
        scroll.pack(fill="both", expand=True)

        for st in STATE_LIST:
            box = ctk.CTkFrame(scroll, fg_color=self.colors["surface_card"], corner_radius=6)
            box.pack(fill="x", padx=6, pady=6)
            ctk.CTkLabel(box, text=f"📍 {st.get('state', '')}", font=ctk.CTkFont(size=15, weight="bold"), text_color=self.colors["primary"]).pack(anchor="w", padx=12, pady=(8, 2))
            if st.get("policy"):
                ctk.CTkLabel(box, text=st.get("policy"), font=ctk.CTkFont(size=11, weight="bold"), text_color=self.colors["accent"]).pack(anchor="w", padx=12, pady=(0, 6))

            for sc in st.get("schemes", []):
                srow = ctk.CTkFrame(box, fg_color=self.colors["surface"], corner_radius=4)
                srow.pack(fill="x", padx=12, pady=3)
                ctk.CTkLabel(srow, text=f"• {sc.get('name', '')} ({sc.get('type', '')})", font=ctk.CTkFont(size=12, weight="bold"), text_color=self.colors["text"]).pack(anchor="w", padx=8, pady=(4, 1))
                ctk.CTkLabel(srow, text=sc.get("benefit", sc.get("description", "")), font=ctk.CTkFont(size=11), text_color=self.colors["text_muted"]).pack(anchor="w", padx=8, pady=(0, 4))

    def show_incubators_tab(self):
        self.active_tab_fn = self.show_incubators_tab
        self._clear_main()
        self._highlight_nav(self.btn_incubators)

        frame = ctk.CTkFrame(self.main_container, fg_color="transparent")
        frame.pack(fill="both", expand=True, padx=20, pady=16)

        ctk.CTkLabel(frame, text="🔬 220+ Incubators & Accelerators Hub", font=ctk.CTkFont(family="Newsreader", size=22, weight="bold"), text_color=self.colors["text"]).pack(anchor="w", pady=(0, 10))

        scroll = ctk.CTkScrollableFrame(frame, fg_color=self.colors["surface_alt"], corner_radius=8)
        scroll.pack(fill="both", expand=True)

        for inc in INCUBATORS_LIST:
            card = ctk.CTkFrame(scroll, fg_color=self.colors["surface_card"], corner_radius=6)
            card.pack(fill="x", padx=6, pady=4)
            ctk.CTkLabel(card, text=inc.get("name", ""), font=ctk.CTkFont(size=14, weight="bold"), text_color=self.colors["text"]).pack(anchor="w", padx=12, pady=(8, 2))
            ctk.CTkLabel(card, text=f"{inc.get('type', '')} · {inc.get('city', '')}, {inc.get('state', '')} · Host: {inc.get('host', '')}", font=ctk.CTkFont(size=11), text_color=self.colors["accent"]).pack(anchor="w", padx=12, pady=(0, 6))

    # -------------------------------------------------------------
    # 6. STACK & 7. PROMPTS & 8. CALC & 9. WORKSHEETS
    # -------------------------------------------------------------
    def show_stack_tab(self):
        self.active_tab_fn = self.show_stack_tab
        self._clear_main()
        self._highlight_nav(self.btn_stack)

        frame = ctk.CTkFrame(self.main_container, fg_color="transparent")
        frame.pack(fill="both", expand=True, padx=20, pady=16)

        ctk.CTkLabel(frame, text="⚡ Founder Knowledge Stack Manager (01-10)", font=ctk.CTkFont(family="Newsreader", size=22, weight="bold"), text_color=self.colors["text"]).pack(anchor="w", pady=(0, 10))

        split = ctk.CTkFrame(frame, fg_color="transparent")
        split.pack(fill="both", expand=True)
        split.grid_columnconfigure(0, weight=3)
        split.grid_columnconfigure(1, weight=7)
        split.grid_rowconfigure(0, weight=1)

        nav = ctk.CTkScrollableFrame(split, fg_color=self.colors["surface"], corner_radius=8)
        nav.grid(row=0, column=0, sticky="nsew", padx=(0, 10))

        self.stack_editor = ctk.CTkTextbox(split, font=ctk.CTkFont(family="Consolas", size=12), fg_color=self.colors["surface_alt"], text_color=self.colors["text"])
        self.stack_editor.grid(row=0, column=1, sticky="nsew")

        stack_sections = [
            ("CONTEXT.md", "📄 Company One-Pager"),
            ("01-company", "01 · Company Overview"),
            ("02-customer", "02 · Customer & ICP"),
            ("03-market", "03 · Market Sizing"),
            ("04-product", "04 · Product & Roadmap"),
            ("05-gtm", "05 · GTM & Distribution"),
            ("06-operations", "06 · Operations & Legal"),
            ("07-money", "07 · Unit Economics"),
            ("08-capital", "08 · Grants & Cap Table"),
            ("09-brand", "09 · Brand & Voice"),
            ("10-pulse", "10 · Weekly Recaps")
        ]

        for sid, stitle in stack_sections:
            ctk.CTkButton(nav, text=stitle, anchor="w", fg_color=self.colors["surface_card"], hover_color=self.colors["surface_alt"], text_color=self.colors["text"], command=lambda s=sid: self._load_stack_doc(s)).pack(fill="x", padx=4, pady=3)

        self._load_stack_doc("CONTEXT.md")

    def _load_stack_doc(self, sid):
        self.stack_editor.delete("1.0", "end")
        p = os.path.join(STACK_DIR, "CONTEXT.md") if sid == "CONTEXT.md" else None
        if not p:
            sdir = os.path.join(STACK_DIR, sid)
            if os.path.exists(sdir):
                files = [f for f in os.listdir(sdir) if f.endswith(".md")]
                if files:
                    p = os.path.join(sdir, files[0])

        if p and os.path.exists(p):
            with open(p, "r", encoding="utf-8") as f:
                self.stack_editor.insert("1.0", f.read())
        else:
            self.stack_editor.insert("1.0", f"# {sid}\n\n[Section template not found]")

    def show_prompts_tab(self):
        self.active_tab_fn = self.show_prompts_tab
        self._clear_main()
        self._highlight_nav(self.btn_prompts)

        frame = ctk.CTkFrame(self.main_container, fg_color="transparent")
        frame.pack(fill="both", expand=True, padx=20, pady=16)

        ctk.CTkLabel(frame, text="🤖 19 AI Execution Prompts Command Center", font=ctk.CTkFont(family="Newsreader", size=22, weight="bold"), text_color=self.colors["text"]).pack(anchor="w", pady=(0, 10))

        split = ctk.CTkFrame(frame, fg_color="transparent")
        split.pack(fill="both", expand=True)
        split.grid_columnconfigure(0, weight=3)
        split.grid_columnconfigure(1, weight=7)
        split.grid_rowconfigure(0, weight=1)

        pnav = ctk.CTkScrollableFrame(split, fg_color=self.colors["surface"], corner_radius=8)
        pnav.grid(row=0, column=0, sticky="nsew", padx=(0, 10))

        rpane = ctk.CTkFrame(split, fg_color=self.colors["surface_alt"], corner_radius=8)
        rpane.grid(row=0, column=1, sticky="nsew")
        rpane.grid_rowconfigure(1, weight=1)
        rpane.grid_columnconfigure(0, weight=1)

        tact = ctk.CTkFrame(rpane, fg_color="transparent")
        tact.grid(row=0, column=0, sticky="ew", padx=16, pady=10)

        self.prompt_title_lbl = ctk.CTkLabel(tact, text="Select a Prompt", font=ctk.CTkFont(size=14, weight="bold"), text_color=self.colors["text"])
        self.prompt_title_lbl.pack(side="left")

        ctk.CTkButton(tact, text="📋 Copy to Clipboard", fg_color=self.colors["accent"], hover_color=self.colors["accent_hover"], command=self._copy_prompt).pack(side="right")

        self.prompt_box = ctk.CTkTextbox(rpane, font=ctk.CTkFont(family="Consolas", size=12), fg_color=self.colors["surface_card"], text_color=self.colors["text"])
        self.prompt_box.grid(row=1, column=0, sticky="nsew", padx=16, pady=(0, 16))

        pfiles = sorted([f for f in os.listdir(PROMPTS_DIR) if f.endswith(".md") and f != "INDEX.md"])
        for pf in pfiles:
            ctk.CTkButton(pnav, text=f"Prompt {pf[:2]} · {pf[3:].replace('.md','').replace('-',' ').title()}", anchor="w", fg_color=self.colors["surface_card"], hover_color=self.colors["surface_alt"], text_color=self.colors["text"], command=lambda f=pf: self._load_prompt(f)).pack(fill="x", padx=4, pady=3)

        if pfiles:
            self._load_prompt(pfiles[0])

    def _load_prompt(self, fname):
        self.prompt_title_lbl.configure(text=fname.replace(".md", "").replace("-", " ").title())
        self.prompt_box.delete("1.0", "end")
        p = os.path.join(PROMPTS_DIR, fname)
        if os.path.exists(p):
            with open(p, "r", encoding="utf-8") as f:
                self.prompt_box.insert("1.0", f.read())

    def _copy_prompt(self):
        txt = self.prompt_box.get("1.0", "end-1c")
        if txt.strip():
            self.clipboard_clear()
            self.clipboard_append(txt)
            messagebox.showinfo("Copied", "Prompt copied to clipboard! Paste into Claude / ChatGPT / Gemini.")

    def show_calc_tab(self):
        self.active_tab_fn = self.show_calc_tab
        self._clear_main()
        self._highlight_nav(self.btn_calc)

        frame = ctk.CTkFrame(self.main_container, fg_color="transparent")
        frame.pack(fill="both", expand=True, padx=20, pady=16)

        ctk.CTkLabel(frame, text="🧮 Unit Economics & Runway Simulator (India Tax Aware)", font=ctk.CTkFont(family="Newsreader", size=22, weight="bold"), text_color=self.colors["text"]).pack(anchor="w", pady=(0, 10))

        cgrid = ctk.CTkFrame(frame, fg_color="transparent")
        cgrid.pack(fill="both", expand=True)
        cgrid.grid_columnconfigure(0, weight=1)
        cgrid.grid_columnconfigure(1, weight=1)

        icard = ctk.CTkFrame(cgrid, fg_color=self.colors["surface"], corner_radius=8)
        icard.grid(row=0, column=0, sticky="nsew", padx=(0, 10))

        rcard = ctk.CTkFrame(cgrid, fg_color=self.colors["surface_alt"], corner_radius=8)
        rcard.grid(row=0, column=1, sticky="nsew", padx=(10, 0))

        ctk.CTkLabel(icard, text="Financial Drivers", font=ctk.CTkFont(size=14, weight="bold"), text_color=self.colors["text"]).pack(anchor="w", padx=16, pady=12)

        self.var_cash = tk.DoubleVar(value=2500000)
        self._slider(icard, "Cash Balance + Approved Grants (₹)", self.var_cash, 100000, 20000000, 100000)

        self.var_burn = tk.DoubleVar(value=350000)
        self._slider(icard, "Monthly Gross Burn (₹)", self.var_burn, 50000, 2000000, 25000)

        self.var_mrr = tk.DoubleVar(value=120000)
        self._slider(icard, "Monthly Recurring Revenue (MRR) (₹)", self.var_mrr, 0, 2000000, 10000)

        self.var_cac = tk.DoubleVar(value=4500)
        self._slider(icard, "CAC (Customer Acquisition Cost) (₹)", self.var_cac, 500, 50000, 500)

        self.var_arpu = tk.DoubleVar(value=1500)
        self._slider(icard, "ARPU (Average Revenue Per User) (₹)", self.var_arpu, 200, 25000, 100)

        ctk.CTkLabel(rcard, text="Runway & Margin Health Metrics", font=ctk.CTkFont(size=14, weight="bold"), text_color=self.colors["text"]).pack(anchor="w", padx=16, pady=12)

        self.res_runway = self._metric(rcard, "Projected Runway", "0.0 Months", self.colors["success"])
        self.res_burn = self._metric(rcard, "Net Monthly Burn", "₹0", self.colors["primary"])
        self.res_payback = self._metric(rcard, "CAC Payback Period", "0.0 Months", self.colors["accent"])
        self.res_pg = self._metric(rcard, "Est. Payment Gateway Friction (2%+GST)", "₹0", self.colors["text_muted"])

        self._recalc()

    def _slider(self, parent, label, var, from_, to, step):
        f = ctk.CTkFrame(parent, fg_color="transparent")
        f.pack(fill="x", padx=16, pady=6)
        top = ctk.CTkFrame(f, fg_color="transparent")
        top.pack(fill="x")
        ctk.CTkLabel(top, text=label, font=ctk.CTkFont(size=12), text_color=self.colors["text_muted"]).pack(side="left")
        vlbl = ctk.CTkLabel(top, text=f"₹{var.get():,.0f}", font=ctk.CTkFont(size=12, weight="bold"), text_color=self.colors["primary"])
        vlbl.pack(side="right")

        def on_s(val):
            r = round(val / step) * step
            var.set(r)
            vlbl.configure(text=f"₹{r:,.0f}")
            self._recalc()

        ctk.CTkSlider(f, from_=from_, to=to, number_of_steps=int((to - from_)/step), variable=var, command=on_s).pack(fill="x", pady=(4, 0))

    def _metric(self, parent, title, val, col):
        b = ctk.CTkFrame(parent, fg_color=self.colors["surface_card"], corner_radius=6)
        b.pack(fill="x", padx=16, pady=6)
        ctk.CTkLabel(b, text=title, font=ctk.CTkFont(size=11), text_color=self.colors["text_muted"]).pack(anchor="w", padx=12, pady=(6, 0))
        lbl = ctk.CTkLabel(b, text=val, font=ctk.CTkFont(family="Newsreader", size=22, weight="bold"), text_color=col)
        lbl.pack(anchor="w", padx=12, pady=(0, 6))
        return lbl

    def _recalc(self):
        c = self.var_cash.get()
        b = self.var_burn.get()
        m = self.var_mrr.get()
        cac = self.var_cac.get()
        arpu = self.var_arpu.get()

        net_burn = max(0, b - m)
        rw = c / net_burn if net_burn > 0 else 999.0
        net_arpu = arpu * (1 - 0.0236)
        payback = cac / net_arpu if net_arpu > 0 else 99.0
        pg = m * 0.0236

        self.res_runway.configure(text=f"{rw:.1f} Months" if rw < 999 else "Infinite (Profitable)")
        self.res_burn.configure(text=f"₹{net_burn:,.0f}/mo")
        self.res_payback.configure(text=f"{payback:.1f} Months")
        self.res_pg.configure(text=f"₹{pg:,.0f}/mo")

    def show_worksheets_tab(self):
        self.active_tab_fn = self.show_worksheets_tab
        self._clear_main()
        self._highlight_nav(self.btn_worksheets)

        frame = ctk.CTkFrame(self.main_container, fg_color="transparent")
        frame.pack(fill="both", expand=True, padx=20, pady=16)

        ctk.CTkLabel(frame, text="📝 10 Actionable Founder Worksheets", font=ctk.CTkFont(family="Newsreader", size=22, weight="bold"), text_color=self.colors["text"]).pack(anchor="w", pady=(0, 10))

        wscroll = ctk.CTkScrollableFrame(frame, fg_color=self.colors["surface_alt"], corner_radius=8)
        wscroll.pack(fill="both", expand=True)

        wfiles = sorted([f for f in os.listdir(WORKSHEETS_DIR) if f.endswith(".md") and f != "README.md"])
        for wf in wfiles:
            card = ctk.CTkFrame(wscroll, fg_color=self.colors["surface_card"], corner_radius=6)
            card.pack(fill="x", padx=6, pady=4)
            ctk.CTkLabel(card, text=wf.replace(".md", "").replace("-", " ").title(), font=ctk.CTkFont(size=14, weight="bold"), text_color=self.colors["text"]).pack(side="left", padx=14, pady=12)
            ctk.CTkButton(card, text="Open HTML Docs ↗", fg_color=self.colors["primary"], text_color="#000000", font=ctk.CTkFont(weight="bold"), command=lambda f=wf: webbrowser.open(f"file:///{os.path.join(DOCS_DIR, 'worksheets', f.replace('.md','.html'))}")).pack(side="right", padx=14, pady=12)

    # -------------------------------------------------------------
    # WEB & SERVER HANDLERS
    # -------------------------------------------------------------
    def launch_web_app(self):
        webbrowser.open(f"http://localhost:{self.local_server_port}/index.html")

    def rebuild_site(self):
        try:
            res = subprocess.run(["node", "build.mjs"], cwd=BASE_DIR, capture_output=True, text=True, check=True)
            messagebox.showinfo("Build Success", f"Static site rebuilt successfully!\n\n{res.stdout.strip()}")
        except Exception as e:
            messagebox.showerror("Build Error", f"Failed to run build.mjs:\n{str(e)}")


if __name__ == "__main__":
    app = StartupIndiaApp()
    app.mainloop()
