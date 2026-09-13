import React from "react";

export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          {/* Logo Andale Poultry */}
          <div className="flex flex-col items-center mb-4">
            <img
              src="https://media.base44.com/images/public/69ea01df3b955495df5e6ec6/b604aaadb_image.png"
              alt="Andale Poultry"
              className="w-20 h-20 object-contain mb-3"
            />
            <span className="font-heading font-extrabold text-2xl text-primary tracking-tight">Andale Poultry</span>
            <p className="text-muted-foreground text-sm mt-1">Welcome to your Andale Poultry app</p>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="text-muted-foreground mt-1 text-sm">{subtitle}</p>}
        </div>
        <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
          {children}
        </div>
        {footer && (
          <p className="text-center text-sm text-muted-foreground mt-6">{footer}</p>
        )}
      </div>
    </div>
  );
}