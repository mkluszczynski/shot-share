interface HomePageProps {
}

export function HomePage({ }: HomePageProps) {


    return (
        <div className="flex-1 overflow-y-auto">
            <div className="max-w-5xl mx-auto p-8 space-y-8">
                {/* Hero Section */}
                <div className="space-y-6 animate-fade-in">

                    <div className="space-y-3">
                        <h1 className="text-5xl font-bold text-foreground tracking-tight">
                            Capture.<br />
                            <span className="text-primary">Edit.</span> Share.
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
                            Simple screenshot tool with built-in editing and SFTP upload.
                        </p>
                    </div>


                </div>

                {/* Quick Start Guide */}
                <div className="p-6 rounded-xl bg-card border border-border/50 space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-6 bg-primary rounded-full" />
                        <h2 className="text-xl font-semibold text-foreground">Quick Start</h2>
                    </div>

                    <div className="grid gap-3">
                        {[
                            { num: "1", text: "Configure settings and SFTP upload (optional)" },
                            { num: "2", text: "Press Ctrl+Shift+S or click Take Screenshot" },
                            { num: "3", text: "Select region → Edit → Save or Upload" }
                        ].map((step) => (
                            <div key={step.num} className="flex items-start gap-3 group">
                                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-mono text-sm text-primary font-semibold group-hover:bg-primary/20 transition-colors">
                                    {step.num}
                                </div>
                                <p className="text-muted-foreground pt-0.5 leading-relaxed">{step.text}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Keyboard Shortcut Hint */}
                <div className="flex items-center justify-center gap-6 p-6 rounded-xl bg-gradient-to-r from-primary/5 to-transparent border border-primary/10">
                    <span className="text-sm text-muted-foreground font-medium">Default Shortcut:</span>
                    <div className="flex items-center gap-2">
                        {['Ctrl', 'Shift', 'S'].map((key, i, arr) => (
                            <>
                                <kbd key={key} className="px-3 py-1.5 bg-card border border-border rounded-lg font-mono text-sm text-foreground shadow-sm">
                                    {key}
                                </kbd>
                                {i < arr.length - 1 && <span className="text-muted-foreground">+</span>}
                            </>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
