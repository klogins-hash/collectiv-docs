import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex flex-col justify-center items-center text-center flex-1 px-4 py-16">
      <div className="max-w-3xl">
        <h1 className="text-5xl font-bold mb-6">The Collectiv</h1>
        <p className="text-xl text-muted-foreground mb-8">
          A creator cooperative where you crowdfund to get in, own your IP and cooperative equity, 
          and borrow against your equity to build wealth.
        </p>
        <p className="text-lg text-muted-foreground mb-12">
          We're building tools and infrastructure together. You're not joining something finished. 
          You're helping build something you'll own part of.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/docs" 
            className="inline-flex items-center justify-center px-8 py-3 text-lg font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Read the Docs
          </Link>
          <Link 
            href="/docs/business-model" 
            className="inline-flex items-center justify-center px-8 py-3 text-lg font-semibold border border-input rounded-lg hover:bg-accent transition-colors"
          >
            How It Works
          </Link>
        </div>
        
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div>
            <h3 className="font-bold text-lg mb-2">Own Your Work</h3>
            <p className="text-sm text-muted-foreground">
              You keep 100% of your IP. No platform takes a cut. Your creations are yours.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-2">Build Wealth</h3>
            <p className="text-sm text-muted-foreground">
              Borrow against your equity like billionaires do. No need to cash out.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-2">One Member, One Vote</h3>
            <p className="text-sm text-muted-foreground">
              Democratic governance. Every member has equal say in how we operate.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
