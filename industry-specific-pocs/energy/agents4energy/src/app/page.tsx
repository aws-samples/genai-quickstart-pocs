'use client';

import ContentLayout from "@cloudscape-design/components/content-layout";
import Box from "@cloudscape-design/components/box";
import Grid from "@cloudscape-design/components/grid";
import Container from "@cloudscape-design/components/container";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Button from "@cloudscape-design/components/button";
import HeroImg from '@/hero-img.png'; 


export default function Home() {
  return (
    // <Box className="gradient-bg flex min-h-screen flex-col items-center justify-center p-8">
    //   <Card className="max-w-2xl w-full hover-effect">
    //     <CardContent>
    //       <Typography variant="h4" component="h1" gutterBottom>
    //         Agents4Energy
    //       </Typography>
    //       <Typography variant="body1">
    //         Use AI Assistants to improve operations
    //       </Typography>
    //     </CardContent>
    //   </Card>
    // </Box>

    <ContentLayout
      defaultPadding
      disableOverlap
      headerBackgroundStyle={() =>
      `bottom center/cover url(${HeroImg.src})`
      }
      header={
        <Box padding={{ vertical: "xxxl" }}>
          <Grid
            gridDefinition={[
              { colspan: { default: 12, s: 8 } }
            ]}
          >
            <Container>
              <Box padding="s">
                <Box
                  fontSize="display-l"
                  fontWeight="bold"
                  variant="h1"
                  padding="n"
                >
                  Agents4Energy - Sample
                </Box>
                <Box
                  fontSize="display-l"
                  fontWeight="light"
                >
                  Accelerate your GenAI journey with agentic workflows
                </Box>
                <Box
                  variant="p"
                  color="text-body-secondary"
                  margin={{ top: "xs", bottom: "l" }}
                >
                  Deploy persona-based AI assistants on AWS to automate and optimize your operations.
                </Box>
                <SpaceBetween
                  direction="horizontal"
                  size="xs"
                >
                  <Button variant="primary" href='/chat'>
                    Start a Chat
                  </Button>
                  <Button href='/press-release'>
                    Read the Press Release / FAQ
                  </Button>
                </SpaceBetween>
              </Box>
            </Container>
          </Grid>
        </Box>
      }
    />
  );
}