# Comprehensive Cursor Rules Suggestions

## Core Business Management Rules

```
## Business Template & Project Management System

You are an expert AI assistant specialized in building and managing Next.js web applications that serve as business management centers and project templates.

### Project Context
This is a "next-shadcn-template" web app that serves as:
- The AI-to-human center of a holding company business
- A template generator for new Next.js projects
- A central management hub for multiple revenue-generating projects
- A communication hub where other projects can ping back for services

### Core Technologies & Standards
- Framework: Next.js 14+ with App Router
- Styling: Tailwind CSS (required for all styling)
- UI Components: shadcn/ui library
- Database: MongoDB with proper connection pooling
- Authentication: Clerk for user management
- Payments: Stripe integration (when needed)
- Language: TypeScript (strict mode)
- State Management: React hooks + server state when appropriate

### Code Quality Standards
- Always write production-ready, bug-free, fully functional code
- Implement proper error handling with try/catch blocks
- Use strict TypeScript typing with interfaces in /lib/models/
- Follow ESLint rules and fix all linter errors
- Add loading states and empty states for all user interactions
- Implement proper accessibility features (ARIA labels, semantic HTML)
- Use responsive design patterns for all UI components

### Architecture Patterns
- API routes in /app/api/ with proper HTTP status codes
- Models/interfaces in /lib/models/ for data structures
- Utilities in /lib/ for shared functionality
- Components in /components/ with proper TypeScript props
- Database queries should be optimized and indexed appropriately
- Implement proper environment variable management

### Business Logic Requirements
- All features should be designed for multi-project management
- Consider scalability for managing multiple revenue streams
- Implement proper project isolation and data separation
- Design APIs that other projects can easily integrate with
- Build reusable components that can be templated for new projects
- Include audit trails and logging for business operations

### Template Generation Features
When building template generation functionality:
- Create configurable code templates for common features
- Include setup scripts for new project initialization
- Generate boilerplate code for authentication, database, payments
- Provide project scaffolding with proper dependency management
- Include environment setup and deployment configurations
```

## Specific Feature Rules

```
## Authentication & Security Rules

### Clerk Integration
- Always implement proper Clerk authentication flows
- Create custom sign-in/sign-up pages that match the brand
- Implement role-based access control for business management
- Add unauthorized access pages for security incidents
- Include session management and device tracking
- Implement proper redirect flows for different user types

### Security Best Practices
- Validate all API inputs on the server side
- Implement rate limiting for public API endpoints
- Use environment variables for all sensitive configuration
- Add CORS policies for cross-project communication
- Implement proper API key management for inter-project communication
- Include audit logging for sensitive business operations

## Database & MongoDB Rules

### Connection Management
- Always use connection pooling with proper global variables
- Implement proper database connection error handling
- Use consistent collection naming conventions (snake_case)
- Create proper indexes for frequently queried fields
- Implement data validation at the database level

### Data Modeling
- Design schemas that support multi-project architecture
- Include audit fields (createdAt, updatedAt, createdBy)
- Implement soft deletes for important business data
- Use proper data types and validation schemas
- Consider data relationships across projects

## Project Management Rules

### Multi-Project Architecture
- Design APIs that can serve multiple child projects
- Implement project isolation and data segregation
- Create template systems for rapid project deployment
- Include project status tracking and monitoring
- Build communication channels between projects

### Revenue Stream Management
- Track project performance and revenue metrics
- Implement billing and subscription management
- Create reporting systems for business intelligence
- Include cost tracking and profit analysis
- Build integration points for external financial systems

## Template Generation System

### Code Generation
- Create modular code templates for common features
- Generate proper TypeScript interfaces and types
- Include error handling patterns in generated code
- Generate proper test files and documentation
- Create deployment configurations and scripts

### Project Scaffolding
- Generate complete Next.js project structures
- Include proper dependency management and versions
- Set up proper development and production environments
- Create CI/CD pipeline configurations
- Include monitoring and logging setups
```

## Development Workflow Rules

```
## Development Process Rules

### Code Organization
- Follow established file naming conventions (PascalCase for components, camelCase for utilities)
- Organize features into logical modules
- Create proper separation between business logic and UI
- Implement proper component composition patterns
- Use proper import/export patterns for better tree-shaking

### Testing & Quality Assurance
- Write tests for all business-critical functionality
- Implement proper error boundaries for React components
- Add proper logging for debugging and monitoring
- Include performance monitoring for business metrics
- Implement proper backup and recovery procedures

### Documentation & Maintenance
- Keep the development log updated with all changes
- Document API endpoints with proper examples
- Include setup instructions for new developers
- Create troubleshooting guides for common issues
- Maintain proper version control and change logs

## Deployment & Operations

### Production Readiness
- Implement proper environment configurations
- Set up monitoring and alerting systems
- Include proper backup strategies
- Implement security scanning and vulnerability management
- Create disaster recovery procedures

### Scalability Considerations
- Design for horizontal scaling when needed
- Implement proper caching strategies
- Consider CDN usage for static assets
- Plan for database scaling and optimization
- Include load balancing configurations

## Business Intelligence & Analytics

### Metrics & Reporting
- Track key business metrics across all projects
- Implement proper analytics and user tracking
- Create dashboards for business performance
- Include financial reporting and analysis
- Build integration points for external analytics tools

### Data Management
- Implement proper data governance policies
- Create data export and import functionality
- Include data archiving and retention policies
- Build proper data backup and recovery systems
- Implement GDPR and privacy compliance features
```

## AI Interaction Rules

```
## AI Assistant Workflow Rules

### Development Log Integration
- ALWAYS read guidelines/development-log.md before starting work
- Treat items in the "To-Do Items" section as actionable tasks
- Update the development log after completing any work
- Follow established architectural patterns documented in the log
- Use the search patterns provided in the log to find relevant code

### Code Generation Standards
- Generate complete, production-ready code with no TODOs
- Include proper error handling and edge case management
- Add appropriate loading states and user feedback
- Implement proper accessibility features
- Follow the project's established patterns and conventions

### Business Context Awareness
- Consider the multi-project management context in all decisions
- Design features that can be reused across different projects
- Think about scalability and revenue impact
- Include proper audit trails for business operations
- Consider integration points with external systems

### Communication & Documentation
- Provide clear explanations of architectural decisions
- Document any new patterns or conventions introduced
- Include setup instructions for new features
- Create proper API documentation when building endpoints
- Update relevant documentation files when making changes

### Problem Solving Approach
- Start with understanding the business requirement
- Consider the impact on other projects in the ecosystem
- Design for reusability and template generation
- Think about long-term maintenance and scalability
- Include proper testing and validation strategies
```

These rules can be added to your `.cursorrules` file or kept as a reference document. They're designed specifically for your unique business model of managing multiple projects through a central template system while maintaining high code quality and business intelligence. 