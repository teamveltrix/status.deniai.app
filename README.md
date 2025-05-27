# Status Page

A modern status page application built with Next.js, shadcn/ui, and PostgreSQL - similar to statuspage.io.

## Features

- **Public Status Page**: Clean, responsive status page showing service health
- **Admin Dashboard**: Comprehensive dashboard for managing services and incidents
- **Service Management**: Add, edit, and monitor service status
- **Incident Management**: Create incidents, add updates, and track resolution
- **Service Integration**: Link incidents to affected services
- **Real-time Updates**: Live status updates and incident tracking
- **Modern UI**: Built with shadcn/ui components and Tailwind CSS
- **Database Powered**: PostgreSQL with Drizzle ORM

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI Components**: shadcn/ui, Tailwind CSS
- **Database**: PostgreSQL with Drizzle ORM
- **Deployment**: Cloudflare (configured with OpenNext)

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- pnpm (recommended) or npm

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   
   Update `.env.local` with your database URL and other settings.

4. Set up the database:
   ```bash
   # Generate database migrations
   pnpm db:generate
   
   # Apply migrations to your database
   pnpm db:migrate
   
   # Or push schema directly (for development)
   pnpm db:push
   ```

5. Start the development server:
   ```bash
   pnpm dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) to see the status page
7. Visit [http://localhost:3000/dashboard](http://localhost:3000/dashboard) for the admin dashboard

## Database Commands

- `pnpm db:generate` - Generate migration files from schema changes
- `pnpm db:migrate` - Apply migrations to the database
- `pnpm db:push` - Push schema changes directly (development)
- `pnpm db:studio` - Open Drizzle Studio for database management

## Usage

### Public Status Page
- Shows overall system status
- Lists all services and their current status
- Displays active incidents with updates
- Clean, professional interface for customers

### Admin Dashboard
- **Overview**: Dashboard with service and incident statistics
- **Services**: Manage services, set status, add descriptions and URLs
- **Incidents**: Create incidents, add updates, link to affected services
- **Settings**: Configure site settings and preferences

### Service Management
1. Go to Dashboard → Services
2. Click "Add Service" to create a new service
3. Set service name, description, URL, and initial status
4. Services appear on the public status page

### Incident Management
1. Go to Dashboard → Incidents
2. Click "Create Incident" to report a new incident
3. Select affected services and set impact level
4. Add updates as the incident progresses
5. Mark as resolved when fixed

## API Endpoints

The application provides REST API endpoints:

- `GET /api/services` - List all services
- `POST /api/services` - Create a new service
- `PUT /api/services/:id` - Update a service
- `DELETE /api/services/:id` - Delete a service
- `GET /api/incidents` - List all incidents
- `POST /api/incidents` - Create a new incident
- `GET /api/incidents/:id` - Get incident details
- `POST /api/incidents/:id/updates` - Add incident update

## Deployment

This project is configured for deployment on Cloudflare using OpenNext. 

1. Set up your database (PostgreSQL)
2. Configure environment variables in your deployment platform
3. Run the build command:
   ```bash
   pnpm build
   ```
4. Deploy to your platform of choice

## Customization

### Styling
- Modify `app/globals.css` for global styles
- Update the shadcn/ui theme in `components.json`
- Customize colors and branding in Tailwind config

### Features
- Add authentication by implementing NextAuth.js
- Add email notifications for incidents
- Integrate with monitoring tools
- Add custom incident templates
- Implement webhooks for external integrations

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).
