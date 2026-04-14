interface FooterProps {
  showLinks?: boolean;
}

export function Footer({ showLinks = true }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#232f3e] text-gray-400 px-6 py-4 mt-auto">
      <div className="flex items-center justify-between text-sm">
        <div>
          <p>© {currentYear}, Amazon Web Services, Inc. or its affiliates. All rights reserved.</p>
        </div>

        {showLinks && (
          <div className="flex items-center gap-6">
            <a
              href="https://aws.amazon.com/privacy/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              Privacy
            </a>
            <a
              href="https://aws.amazon.com/terms/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              Terms
            </a>
            <a
              href="https://aws.amazon.com/privacy/cookies/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              Cookie Preferences
            </a>
          </div>
        )}
      </div>
    </footer>
  );
}
