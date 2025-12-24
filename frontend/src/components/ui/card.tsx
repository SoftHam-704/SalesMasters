import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const cardVariants = cva(
    "rounded-xl border text-card-foreground transition-all duration-300",
    {
        variants: {
            variant: {
                default: "bg-card border-border shadow-lg",
                glass: "bg-card/50 backdrop-blur-xl border-border/50",
                elevated: "bg-card border-border shadow-xl hover:shadow-2xl",
                glow: "bg-card border-primary/20 shadow-lg hover:shadow-primary/10",
                gradient: "bg-gradient-to-br from-card to-secondary border-border/50",
                interactive: "bg-card border-border shadow-lg hover:border-primary/30 hover:shadow-xl hover:-translate-y-1 cursor-pointer",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
);

export interface CardProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> { }

const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className, variant, ...props }, ref) => (
        <div ref={ref} className={cn(cardVariants({ variant, className }))} {...props} />
    )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
    ),
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
    ({ className, ...props }, ref) => (
        <h3 ref={ref} className={cn("text-xl font-bold leading-none tracking-tight", className)} {...props} />
    ),
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
    ({ className, ...props }, ref) => (
        <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
    ),
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />,
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
    ),
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
