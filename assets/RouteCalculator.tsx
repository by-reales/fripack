import { LocationKey } from "./markers";
import { locations } from "./CustomRoutes";

export const calculateRoute = (
  originSede: LocationKey | "",
  destinationSede: LocationKey | "",
  currentHour: number
): { latitude: number; longitude: number }[] => {
  if (!originSede || !destinationSede) return [];
  
  let newRoute: { latitude: number; longitude: number }[] = [];

  if (currentHour >= 6 && currentHour < 13) {
          // Rutas de 6:00 AM a 1:00 PM
          if (originSede === "H1" && destinationSede === "H3") {
            newRoute = [
              locations.H1,
              { latitude: 10.994417, longitude: -74.792333 },
              { latitude: 10.994714, longitude: -74.792065 },
              locations.H3,
            ];
          } else if (originSede === "H3" && destinationSede === "H1") {
            newRoute = [
              locations.H3,
              { latitude: 10.994714, longitude: -74.792065 },
              { latitude: 10.994417, longitude: -74.792333 },
              locations.H1,
            ];
          } else if (originSede === "H1" && destinationSede === "H6") {
            newRoute = [
              locations.H1,
              { latitude: 10.994417, longitude: -74.792333 },
              { latitude: 10.994107, longitude: -74.792635 },
              { latitude: 10.994184, longitude: -74.792726 },
              { latitude: 10.9941, longitude: -74.792797 },
              { latitude: 10.994014, longitude: -74.792941 },
              { latitude: 10.995523, longitude: -74.794536 },
              { latitude: 10.995482, longitude: -74.794618 },
              { latitude: 10.995613, longitude: -74.795054 },
              { latitude: 10.995684, longitude: -74.795164 },
              { latitude: 10.9953, longitude: -74.795821 },
              { latitude: 10.995537, longitude: -74.796272 },
              locations.H6,
            ];
          } else if (originSede === "H6" && destinationSede === "H1") {
            newRoute = [
              locations.H6,
              { latitude: 10.995537, longitude: -74.796272 },
              { latitude: 10.9953, longitude: -74.795821 },
              { latitude: 10.995684, longitude: -74.795164 },
              { latitude: 10.995613, longitude: -74.795054 },
              { latitude: 10.995482, longitude: -74.794618 },
              { latitude: 10.995523, longitude: -74.794536 },
              { latitude: 10.994014, longitude: -74.792941 },
              { latitude: 10.9941, longitude: -74.792797 },
              { latitude: 10.994184, longitude: -74.792726 },
              { latitude: 10.994107, longitude: -74.792635 },
              { latitude: 10.994417, longitude: -74.792333 },
              locations.H1,
            ];
          } else if (originSede === "H1" && destinationSede === "H4") {
            newRoute = [
              locations.H1,
              { latitude: 10.994417, longitude: -74.792333 },
              { latitude: 10.994107, longitude: -74.792635 },
              { latitude: 10.994184, longitude: -74.792726 },
              { latitude: 10.9941, longitude: -74.792797 },
              { latitude: 10.994014, longitude: -74.792941 },
              { latitude: 10.995523, longitude: -74.794536 },
              { latitude: 10.995482, longitude: -74.794618 },
              { latitude: 10.995613, longitude: -74.795054 },
              locations.H4,
            ];
          } else if (originSede === "H4" && destinationSede === "H1") {
            newRoute = [
              locations.H4,
              { latitude: 10.995613, longitude: -74.795054 },
              { latitude: 10.995482, longitude: -74.794618 },
              { latitude: 10.995523, longitude: -74.794536 },
              { latitude: 10.994014, longitude: -74.792941 },
              { latitude: 10.9941, longitude: -74.792797 },
              { latitude: 10.994184, longitude: -74.792726 },
              { latitude: 10.994107, longitude: -74.792635 },
              { latitude: 10.994417, longitude: -74.792333 },
              locations.H1,
            ];
          } else if (originSede === "H1" && destinationSede === "H2") {
            newRoute = [
              locations.H1,
              { latitude: 10.994417, longitude: -74.792333 },
              { latitude: 10.994714, longitude: -74.792065 },
              { latitude: 10.995069, longitude: -74.792379 },
              locations.H2,
            ];
          } else if (originSede === "H2" && destinationSede === "H1") {
            newRoute = [
              locations.H2,
              { latitude: 10.995069, longitude: -74.792379 },
              { latitude: 10.994714, longitude: -74.792065 },
              { latitude: 10.994417, longitude: -74.792333 },
              locations.H1,
            ];
          } else if (originSede === "H2" && destinationSede === "H4") {
            newRoute = [
              locations.H2,
              { latitude: 10.995129, longitude: -74.792534 },
              { latitude: 10.995629, longitude: -74.792918 },
              { latitude: 10.9949, longitude: -74.793641 },
              { latitude: 10.99481, longitude: -74.793729 },
              { latitude: 10.995531, longitude: -74.794467 },
              { latitude: 10.995439, longitude: -74.794589 },
              { latitude: 10.995583, longitude: -74.794835 },
              { latitude: 10.995627, longitude: -74.795068 },
              locations.H4,
            ];
          } else if (originSede === "H4" && destinationSede === "H2") {
            newRoute = [
              locations.H4,
              { latitude: 10.995627, longitude: -74.795068 },
              { latitude: 10.995583, longitude: -74.794835 },
              { latitude: 10.995439, longitude: -74.794589 },
              { latitude: 10.995531, longitude: -74.794467 },
              { latitude: 10.99481, longitude: -74.793729 },
              { latitude: 10.9949, longitude: -74.793641 },
              { latitude: 10.995629, longitude: -74.792918 },
              { latitude: 10.995129, longitude: -74.792534 },
              locations.H2,
            ];
          } else if (originSede === "H2" && destinationSede === "H6") {
            newRoute = [
              locations.H2,
              { latitude: 10.995129, longitude: -74.792534 },
              { latitude: 10.995629, longitude: -74.792918 },
              { latitude: 10.9949, longitude: -74.793641 },
              { latitude: 10.99481, longitude: -74.793729 },
              { latitude: 10.995531, longitude: -74.794467 },
              { latitude: 10.995439, longitude: -74.794589 },
              { latitude: 10.995583, longitude: -74.794835 },
              { latitude: 10.995627, longitude: -74.795068 },
              { latitude: 10.995681, longitude: -74.795196 },
              { latitude: 10.9953, longitude: -74.795821 },
              { latitude: 10.995537, longitude: -74.796272 },
  
              locations.H6,
            ];
          } else if (originSede === "H6" && destinationSede === "H2") {
            newRoute = [
              locations.H6,
              { latitude: 10.995537, longitude: -74.796272 },
              { latitude: 10.9953, longitude: -74.795821 },
              { latitude: 10.995681, longitude: -74.795196 },
              { latitude: 10.995627, longitude: -74.795068 },
              { latitude: 10.995583, longitude: -74.794835 },
              { latitude: 10.995439, longitude: -74.794589 },
              { latitude: 10.995531, longitude: -74.794467 },
              { latitude: 10.99481, longitude: -74.793729 },
              { latitude: 10.9949, longitude: -74.793641 },
              { latitude: 10.995629, longitude: -74.792918 },
              { latitude: 10.995129, longitude: -74.792534 },
              locations.H2,
            ];
          } else if (originSede === "H7" && destinationSede === "H6") {
            newRoute = [
              locations.H7,
              { latitude: 10.994794, longitude: -74.792063 },
              { latitude: 10.995129, longitude: -74.792534 },
              { latitude: 10.995629, longitude: -74.792918 },
              { latitude: 10.9949, longitude: -74.793641 },
              { latitude: 10.99481, longitude: -74.793729 },
              { latitude: 10.995531, longitude: -74.794467 },
              { latitude: 10.995439, longitude: -74.794589 },
              { latitude: 10.995583, longitude: -74.794835 },
              { latitude: 10.995627, longitude: -74.795068 },
              { latitude: 10.995681, longitude: -74.795196 },
              { latitude: 10.9953, longitude: -74.795821 },
              { latitude: 10.995537, longitude: -74.796272 },
  
              locations.H6,
            ];
          } else if (originSede === "H6" && destinationSede === "H7") {
            newRoute = [
              locations.H6,
              { latitude: 10.995537, longitude: -74.796272 },
              { latitude: 10.9953, longitude: -74.795821 },
              { latitude: 10.995681, longitude: -74.795196 },
              { latitude: 10.995627, longitude: -74.795068 },
              { latitude: 10.995583, longitude: -74.794835 },
              { latitude: 10.995439, longitude: -74.794589 },
              { latitude: 10.995531, longitude: -74.794467 },
              { latitude: 10.99481, longitude: -74.793729 },
              { latitude: 10.9949, longitude: -74.793641 },
              { latitude: 10.995629, longitude: -74.792918 },
              { latitude: 10.995129, longitude: -74.792534 },
              { latitude: 10.994794, longitude: -74.792063 },
              locations.H7,
            ];
          } else if (originSede === "H7" && destinationSede === "H1") {
            newRoute = [
              locations.H7,
              { latitude: 10.994283, longitude: -74.792419 },
              locations.H1,
            ];
          } else if (originSede === "H1" && destinationSede === "H7") {
            newRoute = [
              locations.H1,
              { latitude: 10.994283, longitude: -74.792419 },
              locations.H7,
            ];
          } else if (originSede === "H7" && destinationSede === "H3") {
            newRoute = [
              locations.H7,
              { latitude: 10.994794, longitude: -74.792063 },
              locations.H3,
            ];
          } else if (originSede === "H3" && destinationSede === "H7") {
            newRoute = [
              locations.H3,
              { latitude: 10.994794, longitude: -74.792063 },
              locations.H7,
            ];
          } else if (originSede === "H7" && destinationSede === "H2") {
            newRoute = [
              locations.H7,
              { latitude: 10.994854, longitude: -74.791991 },
              locations.H2,
            ];
          } else if (originSede === "H2" && destinationSede === "H7") {
            newRoute = [
              locations.H2,
              { latitude: 10.994854, longitude: -74.791991 },
              locations.H7,
            ];
          } else if (originSede === "H7" && destinationSede === "H4") {
            newRoute = [
              locations.H7,
              { latitude: 10.994794, longitude: -74.792063 },
              { latitude: 10.995129, longitude: -74.792534 },
              { latitude: 10.995629, longitude: -74.792918 },
              { latitude: 10.9949, longitude: -74.793641 },
              { latitude: 10.99481, longitude: -74.793729 },
              { latitude: 10.995531, longitude: -74.794467 },
              { latitude: 10.995439, longitude: -74.794589 },
              { latitude: 10.995583, longitude: -74.794835 },
              { latitude: 10.995627, longitude: -74.795068 },
              locations.H4,
            ];
          } else if (originSede === "H4" && destinationSede === "H7") {
            newRoute = [
              locations.H4,
              { latitude: 10.995627, longitude: -74.795068 },
              { latitude: 10.995583, longitude: -74.794835 },
              { latitude: 10.995439, longitude: -74.794589 },
              { latitude: 10.995531, longitude: -74.794467 },
              { latitude: 10.99481, longitude: -74.793729 },
              { latitude: 10.9949, longitude: -74.793641 },
              { latitude: 10.995629, longitude: -74.792918 },
              { latitude: 10.995129, longitude: -74.792534 },
              { latitude: 10.994794, longitude: -74.792063 },
              locations.H7,
            ];
          } else if (originSede === "H3" && destinationSede === "H4") {
            newRoute = [
              locations.H3,
              { latitude: 10.995629, longitude: -74.792918 },
              { latitude: 10.9949, longitude: -74.793641 },
              { latitude: 10.99481, longitude: -74.793729 },
              { latitude: 10.995531, longitude: -74.794467 },
              { latitude: 10.995444, longitude: -74.794625 },
              { latitude: 10.995627, longitude: -74.795068 },
              locations.H4,
            ];
          } else if (originSede === "H4" && destinationSede === "H3") {
            newRoute = [
              locations.H4,
              { latitude: 10.995627, longitude: -74.795068 },
              { latitude: 10.995444, longitude: -74.794625 },
              { latitude: 10.995531, longitude: -74.794467 },
              { latitude: 10.99481, longitude: -74.793729 },
              { latitude: 10.9949, longitude: -74.793641 },
              { latitude: 10.995629, longitude: -74.792918 },
              locations.H3,
            ];
          } else if (originSede === "H4" && destinationSede === "H6") {
            newRoute = [
              locations.H4,
              { latitude: 10.995682, longitude: -74.795133 },
              { latitude: 10.995308, longitude: -74.795826 },
              { latitude: 10.995516, longitude: -74.79625 },
              locations.H6,
            ];
          } else if (originSede === "H6" && destinationSede === "H4") {
            newRoute = [
              locations.H6,
              { latitude: 10.995516, longitude: -74.79625 },
              { latitude: 10.995308, longitude: -74.795826 },
              { latitude: 10.995682, longitude: -74.795133 },
              locations.H4,
            ];
          } else if (originSede === "H3" && destinationSede === "H6") {
            newRoute = [
              locations.H3,
              { latitude: 10.995629, longitude: -74.792918 },
              { latitude: 10.9949, longitude: -74.793641 },
              { latitude: 10.99481, longitude: -74.793729 },
              { latitude: 10.995531, longitude: -74.794467 },
              { latitude: 10.995444, longitude: -74.794625 },
              { latitude: 10.995583, longitude: -74.794835 },
              { latitude: 10.995627, longitude: -74.795068 },
              { latitude: 10.995681, longitude: -74.795196 },
              { latitude: 10.9953, longitude: -74.795821 },
              { latitude: 10.995537, longitude: -74.796272 },
              locations.H6,
            ];
          } else if (originSede === "H6" && destinationSede === "H3") {
            newRoute = [
              locations.H6,
              { latitude: 10.995537, longitude: -74.796272 },
              { latitude: 10.9953, longitude: -74.795821 },
              { latitude: 10.995681, longitude: -74.795196 },
              { latitude: 10.995627, longitude: -74.795068 },
              { latitude: 10.995583, longitude: -74.794835 },
              { latitude: 10.995444, longitude: -74.794625 },
              { latitude: 10.995531, longitude: -74.794467 },
              { latitude: 10.99481, longitude: -74.793729 },
              { latitude: 10.9949, longitude: -74.793641 },
              { latitude: 10.995629, longitude: -74.792918 },
              locations.H3,
            ];
          }
        } else if (currentHour >= 13 && currentHour < 14) {
          // Rutas de 1:00 PM a 2:00 PM
          if (originSede === "H1" && destinationSede === "H3") {
            newRoute = [
              locations.H1,
              { latitude: 10.994417, longitude: -74.792333 },
              { latitude: 10.994714, longitude: -74.792065 },
              locations.H3,
            ];
          } else if (originSede === "H3" && destinationSede === "H1") {
            newRoute = [
              locations.H3,
              { latitude: 10.994714, longitude: -74.792065 },
              { latitude: 10.994417, longitude: -74.792333 },
              locations.H1,
            ];
          } else if (originSede === "H7" && destinationSede === "H1") {
            newRoute = [
              locations.H7,
              { latitude: 10.994283, longitude: -74.792419 },
              locations.H1,
            ];
          } else if (originSede === "H1" && destinationSede === "H7") {
            newRoute = [
              locations.H1,
              { latitude: 10.994283, longitude: -74.792419 },
              locations.H7,
            ];
          } else if (originSede === "H7" && destinationSede === "H3") {
            newRoute = [
              locations.H7,
              { latitude: 10.994794, longitude: -74.792063 },
              locations.H3,
            ];
          } else if (originSede === "H3" && destinationSede === "H7") {
            newRoute = [
              locations.H3,
              { latitude: 10.994794, longitude: -74.792063 },
              locations.H7,
            ];
          } else if (originSede === "H7" && destinationSede === "H2") {
            newRoute = [
              locations.H7,
              { latitude: 10.994854, longitude: -74.791991 },
              locations.H2,
            ];
          } else if (originSede === "H2" && destinationSede === "H7") {
            newRoute = [
              locations.H2,
              { latitude: 10.994854, longitude: -74.791991 },
              locations.H7,
            ];
          } else if (originSede === "H1" && destinationSede === "H2") {
            newRoute = [
              locations.H1,
              { latitude: 10.994417, longitude: -74.792333 },
              { latitude: 10.994714, longitude: -74.792065 },
              { latitude: 10.995069, longitude: -74.792379 },
              locations.H2,
            ];
          } else if (originSede === "H2" && destinationSede === "H1") {
            newRoute = [
              locations.H2,
              { latitude: 10.995069, longitude: -74.792379 },
              { latitude: 10.994714, longitude: -74.792065 },
              { latitude: 10.994417, longitude: -74.792333 },
              locations.H1,
            ];
          } else if (originSede === "H1" && destinationSede === "H6") {
            newRoute = [
              locations.H1,
              { latitude: 10.994381, longitude: -74.79235 },
              { latitude: 10.994108, longitude: -74.792638 },
              { latitude: 10.994179, longitude: -74.792719 },
              { latitude: 10.9941, longitude: -74.792807 },
              { latitude: 10.995607, longitude: -74.794399 },
              { latitude: 10.99548, longitude: -74.7946 },
              { latitude: 10.995615, longitude: -74.79478 },
              { latitude: 10.995562, longitude: -74.795032 },
              { latitude: 10.995665, longitude: -74.795144 },
              { latitude: 10.995278, longitude: -74.795805 },
              { latitude: 10.995475, longitude: -74.796161 },
              locations.H6,
            ];
          } else if (originSede === "H6" && destinationSede === "H1") {
            newRoute = [
              locations.H6,
              { latitude: 10.995475, longitude: -74.796161 },
              { latitude: 10.995278, longitude: -74.795805 },
              { latitude: 10.995665, longitude: -74.795144 },
              { latitude: 10.995562, longitude: -74.795032 },
              { latitude: 10.995615, longitude: -74.79478 },
              { latitude: 10.99548, longitude: -74.7946 },
              { latitude: 10.995607, longitude: -74.794399 },
              { latitude: 10.9941, longitude: -74.792807 },
              { latitude: 10.994179, longitude: -74.792719 },
              { latitude: 10.994108, longitude: -74.792638 },
              { latitude: 10.994381, longitude: -74.79235 },
              locations.H1,
            ];
          } else if (originSede === "H1" && destinationSede === "H4") {
            newRoute = [
              locations.H1,
              { latitude: 10.994381, longitude: -74.79235 },
              { latitude: 10.994108, longitude: -74.792638 },
              { latitude: 10.994179, longitude: -74.792719 },
              { latitude: 10.9941, longitude: -74.792807 },
              { latitude: 10.995607, longitude: -74.794399 },
              { latitude: 10.99548, longitude: -74.7946 },
              { latitude: 10.995615, longitude: -74.79478 },
              { latitude: 10.995562, longitude: -74.795032 },
              { latitude: 10.995665, longitude: -74.795144 },
              locations.H4,
            ];
          } else if (originSede === "H4" && destinationSede === "H1") {
            newRoute = [
              locations.H4,
              { latitude: 10.995665, longitude: -74.795144 },
              { latitude: 10.995562, longitude: -74.795032 },
              { latitude: 10.995615, longitude: -74.79478 },
              { latitude: 10.99548, longitude: -74.7946 },
              { latitude: 10.995607, longitude: -74.794399 },
              { latitude: 10.9941, longitude: -74.792807 },
              { latitude: 10.994179, longitude: -74.792719 },
              { latitude: 10.994108, longitude: -74.792638 },
              { latitude: 10.994381, longitude: -74.79235 },
              locations.H1,
            ];
          } else if (originSede === "H4" && destinationSede === "H6") {
            newRoute = [
              locations.H4,
              { latitude: 10.995682, longitude: -74.795133 },
              { latitude: 10.995308, longitude: -74.795826 },
              { latitude: 10.995516, longitude: -74.79625 },
              locations.H6,
            ];
          } else if (originSede === "H6" && destinationSede === "H4") {
            newRoute = [
              locations.H6,
              { latitude: 10.995516, longitude: -74.79625 },
              { latitude: 10.995308, longitude: -74.795826 },
              { latitude: 10.995682, longitude: -74.795133 },
              locations.H4,
            ];
          } else if (originSede === "H2" && destinationSede === "H6") {
            newRoute = [
              locations.H2,
              { latitude: 10.995129, longitude: -74.792534 },
              { latitude: 10.995618, longitude: -74.792937 },
              { latitude: 10.994914, longitude: -74.793654 },
              { latitude: 10.995607, longitude: -74.794399 },
              { latitude: 10.99548, longitude: -74.7946 },
              { latitude: 10.995615, longitude: -74.79478 },
              { latitude: 10.995562, longitude: -74.795032 },
              { latitude: 10.995665, longitude: -74.795144 },
              { latitude: 10.995278, longitude: -74.795805 },
              { latitude: 10.995475, longitude: -74.796161 },
              locations.H6,
            ];
          } else if (originSede === "H6" && destinationSede === "H2") {
            newRoute = [
              locations.H6,
              { latitude: 10.995475, longitude: -74.796161 },
              { latitude: 10.995278, longitude: -74.795805 },
              { latitude: 10.995665, longitude: -74.795144 },
              { latitude: 10.995562, longitude: -74.795032 },
              { latitude: 10.995615, longitude: -74.79478 },
              { latitude: 10.99548, longitude: -74.7946 },
              { latitude: 10.995607, longitude: -74.794399 },
              { latitude: 10.994914, longitude: -74.793654 },
              { latitude: 10.995618, longitude: -74.792937 },
              { latitude: 10.995129, longitude: -74.792534 },
              locations.H2,
            ];
          } else if (originSede === "H7" && destinationSede === "H6") {
            newRoute = [
              locations.H7,
              { latitude: 10.994794, longitude: -74.792063 },
              { latitude: 10.995129, longitude: -74.792534 },
              { latitude: 10.995618, longitude: -74.792937 },
              { latitude: 10.994914, longitude: -74.793654 },
              { latitude: 10.995607, longitude: -74.794399 },
              { latitude: 10.99548, longitude: -74.7946 },
              { latitude: 10.995615, longitude: -74.79478 },
              { latitude: 10.995562, longitude: -74.795032 },
              { latitude: 10.995665, longitude: -74.795144 },
              { latitude: 10.995278, longitude: -74.795805 },
              { latitude: 10.995475, longitude: -74.796161 },
              locations.H6,
            ];
          } else if (originSede === "H6" && destinationSede === "H7") {
            newRoute = [
              locations.H6,
              { latitude: 10.995475, longitude: -74.796161 },
              { latitude: 10.995278, longitude: -74.795805 },
              { latitude: 10.995665, longitude: -74.795144 },
              { latitude: 10.995562, longitude: -74.795032 },
              { latitude: 10.995615, longitude: -74.79478 },
              { latitude: 10.99548, longitude: -74.7946 },
              { latitude: 10.995607, longitude: -74.794399 },
              { latitude: 10.994914, longitude: -74.793654 },
              { latitude: 10.995618, longitude: -74.792937 },
              { latitude: 10.995129, longitude: -74.792534 },
              { latitude: 10.994794, longitude: -74.792063 },
              locations.H7,
            ];
          } else if (originSede === "H7" && destinationSede === "H4") {
            newRoute = [
              locations.H7,
              { latitude: 10.994794, longitude: -74.792063 },
              { latitude: 10.995129, longitude: -74.792534 },
              { latitude: 10.995618, longitude: -74.792937 },
              { latitude: 10.994914, longitude: -74.793654 },
              { latitude: 10.995607, longitude: -74.794399 },
              { latitude: 10.99548, longitude: -74.7946 },
              { latitude: 10.995615, longitude: -74.79478 },
              { latitude: 10.995562, longitude: -74.795032 },
              { latitude: 10.995665, longitude: -74.795144 },
              locations.H4,
            ];
          } else if (originSede === "H4" && destinationSede === "H7") {
            newRoute = [
              locations.H4,
              { latitude: 10.995665, longitude: -74.795144 },
              { latitude: 10.995562, longitude: -74.795032 },
              { latitude: 10.995615, longitude: -74.79478 },
              { latitude: 10.99548, longitude: -74.7946 },
              { latitude: 10.995607, longitude: -74.794399 },
              { latitude: 10.994914, longitude: -74.793654 },
              { latitude: 10.995618, longitude: -74.792937 },
              { latitude: 10.995129, longitude: -74.792534 },
              { latitude: 10.994794, longitude: -74.792063 },
              locations.H7,
            ];
          } else if (originSede === "H2" && destinationSede === "H4") {
            newRoute = [
              locations.H2,
              { latitude: 10.995129, longitude: -74.792534 },
              { latitude: 10.995618, longitude: -74.792937 },
              { latitude: 10.994914, longitude: -74.793654 },
              { latitude: 10.995607, longitude: -74.794399 },
              { latitude: 10.99548, longitude: -74.7946 },
              { latitude: 10.995615, longitude: -74.79478 },
              { latitude: 10.995562, longitude: -74.795032 },
              { latitude: 10.995665, longitude: -74.795144 },
              locations.H4,
            ];
          } else if (originSede === "H4" && destinationSede === "H2") {
            newRoute = [
              locations.H4,
              { latitude: 10.995665, longitude: -74.795144 },
              { latitude: 10.995562, longitude: -74.795032 },
              { latitude: 10.995615, longitude: -74.79478 },
              { latitude: 10.99548, longitude: -74.7946 },
              { latitude: 10.995607, longitude: -74.794399 },
              { latitude: 10.994914, longitude: -74.793654 },
              { latitude: 10.995618, longitude: -74.792937 },
              { latitude: 10.995129, longitude: -74.792534 },
              locations.H2,
            ];
          } else if (originSede === "H3" && destinationSede === "H4") {
            newRoute = [
              locations.H3,
              { latitude: 10.995618, longitude: -74.792937 },
              { latitude: 10.994914, longitude: -74.793654 },
              { latitude: 10.995607, longitude: -74.794399 },
              { latitude: 10.99548, longitude: -74.7946 },
              { latitude: 10.995615, longitude: -74.79478 },
              { latitude: 10.995562, longitude: -74.795032 },
              { latitude: 10.995665, longitude: -74.795144 },
              locations.H4,
            ];
          } else if (originSede === "H4" && destinationSede === "H3") {
            newRoute = [
              locations.H4,
              { latitude: 10.995665, longitude: -74.795144 },
              { latitude: 10.995562, longitude: -74.795032 },
              { latitude: 10.995615, longitude: -74.79478 },
              { latitude: 10.99548, longitude: -74.7946 },
              { latitude: 10.995607, longitude: -74.794399 },
              { latitude: 10.994914, longitude: -74.793654 },
              { latitude: 10.995618, longitude: -74.792937 },
              { latitude: 10.995129, longitude: -74.792534 },
              locations.H3,
            ];
          } else if (originSede === "H3" && destinationSede === "H6") {
            newRoute = [
              locations.H3,
              { latitude: 10.995618, longitude: -74.792937 },
              { latitude: 10.994914, longitude: -74.793654 },
              { latitude: 10.995607, longitude: -74.794399 },
              { latitude: 10.99548, longitude: -74.7946 },
              { latitude: 10.995615, longitude: -74.79478 },
              { latitude: 10.995562, longitude: -74.795032 },
              { latitude: 10.995665, longitude: -74.795144 },
              { latitude: 10.995278, longitude: -74.795805 },
              { latitude: 10.995475, longitude: -74.796161 },
              locations.H6,
            ];
          } else if (originSede === "H6" && destinationSede === "H3") {
            newRoute = [
              locations.H6,
              { latitude: 10.995475, longitude: -74.796161 },
              { latitude: 10.995278, longitude: -74.795805 },
              { latitude: 10.995665, longitude: -74.795144 },
              { latitude: 10.995562, longitude: -74.795032 },
              { latitude: 10.995615, longitude: -74.79478 },
              { latitude: 10.99548, longitude: -74.7946 },
              { latitude: 10.995607, longitude: -74.794399 },
              { latitude: 10.994914, longitude: -74.793654 },
              { latitude: 10.995618, longitude: -74.792937 },
              locations.H3,
            ];
          }
        } else {
          // Rutas de 2:00 PM a 6:00 AM
          if (originSede === "H1" && destinationSede === "H3") {
            newRoute = [
              locations.H1,
              { latitude: 10.994417, longitude: -74.792333 },
              { latitude: 10.994714, longitude: -74.792065 },
              locations.H3,
            ];
          } else if (originSede === "H3" && destinationSede === "H1") {
            newRoute = [
              locations.H3,
              { latitude: 10.994714, longitude: -74.792065 },
              { latitude: 10.994417, longitude: -74.792333 },
              locations.H1,
            ];
          } else if (originSede === "H7" && destinationSede === "H1") {
            newRoute = [
              locations.H7,
              { latitude: 10.994283, longitude: -74.792419 },
              locations.H1,
            ];
          } else if (originSede === "H1" && destinationSede === "H7") {
            newRoute = [
              locations.H1,
              { latitude: 10.994283, longitude: -74.792419 },
              locations.H7,
            ];
          } else if (originSede === "H7" && destinationSede === "H3") {
            newRoute = [
              locations.H7,
              { latitude: 10.994794, longitude: -74.792063 },
              locations.H3,
            ];
          } else if (originSede === "H3" && destinationSede === "H7") {
            newRoute = [
              locations.H3,
              { latitude: 10.994794, longitude: -74.792063 },
              locations.H7,
            ];
          } else if (originSede === "H7" && destinationSede === "H2") {
            newRoute = [
              locations.H7,
              { latitude: 10.994854, longitude: -74.791991 },
              locations.H2,
            ];
          } else if (originSede === "H2" && destinationSede === "H7") {
            newRoute = [
              locations.H2,
              { latitude: 10.994854, longitude: -74.791991 },
              locations.H7,
            ];
          } else if (originSede === "H1" && destinationSede === "H6") {
            newRoute = [
              locations.H1,
              { latitude: 10.993923, longitude: -74.792513 },
              { latitude: 10.993815, longitude: -74.792458 },
              { latitude: 10.993563, longitude: -74.792607 },
              { latitude: 10.993605, longitude: -74.792722 },
              { latitude: 10.993705, longitude: -74.792891 },
              { latitude: 10.993842, longitude: -74.792883 },
              { latitude: 10.995467, longitude: -74.794667 },
              { latitude: 10.995609, longitude: -74.795053 },
              { latitude: 10.995672, longitude: -74.795252 },
              { latitude: 10.995319, longitude: -74.795831 },
              { latitude: 10.99556, longitude: -74.79629 },
              locations.H6,
            ];
          } else if (originSede === "H6" && destinationSede === "H1") {
            newRoute = [
              locations.H6,
              { latitude: 10.99556, longitude: -74.79629 },
              { latitude: 10.995319, longitude: -74.795831 },
              { latitude: 10.995672, longitude: -74.795252 },
              { latitude: 10.995609, longitude: -74.795053 },
              { latitude: 10.995467, longitude: -74.794667 },
              { latitude: 10.993842, longitude: -74.792883 },
              { latitude: 10.993705, longitude: -74.792891 },
              { latitude: 10.993605, longitude: -74.792722 },
              { latitude: 10.993563, longitude: -74.792607 },
              { latitude: 10.993815, longitude: -74.792458 },
              { latitude: 10.993923, longitude: -74.792513 },
              locations.H1,
            ];
          } else if (originSede === "H1" && destinationSede === "H4") {
            newRoute = [
              locations.H1,
              { latitude: 10.993923, longitude: -74.792513 },
              { latitude: 10.993815, longitude: -74.792458 },
              { latitude: 10.993563, longitude: -74.792607 },
              { latitude: 10.993605, longitude: -74.792722 },
              { latitude: 10.993705, longitude: -74.792891 },
              { latitude: 10.993842, longitude: -74.792883 },
              { latitude: 10.995467, longitude: -74.794667 },
              { latitude: 10.995609, longitude: -74.795053 },
              { latitude: 10.995672, longitude: -74.795252 },
              locations.H4,
            ];
          } else if (originSede === "H4" && destinationSede === "H1") {
            newRoute = [
              locations.H4,
              { latitude: 10.995672, longitude: -74.795252 },
              { latitude: 10.995609, longitude: -74.795053 },
              { latitude: 10.995467, longitude: -74.794667 },
              { latitude: 10.993842, longitude: -74.792883 },
              { latitude: 10.993705, longitude: -74.792891 },
              { latitude: 10.993605, longitude: -74.792722 },
              { latitude: 10.993563, longitude: -74.792607 },
              { latitude: 10.993815, longitude: -74.792458 },
              { latitude: 10.993923, longitude: -74.792513 },
              locations.H1,
            ];
          } else if (originSede === "H1" && destinationSede === "H2") {
            newRoute = [
              locations.H1,
              { latitude: 10.994417, longitude: -74.792333 },
              { latitude: 10.994714, longitude: -74.792065 },
              { latitude: 10.995069, longitude: -74.792379 },
              locations.H2,
            ];
          } else if (originSede === "H2" && destinationSede === "H4") {
            newRoute = [
              locations.H2,
              { latitude: 10.995129, longitude: -74.792534 },
              { latitude: 10.995609, longitude: -74.79292 },
              { latitude: 10.994975, longitude: -74.793551 },
              { latitude: 10.994892, longitude: -74.793631 },
              { latitude: 10.995079, longitude: -74.793834 },
              { latitude: 10.994898, longitude: -74.794025 },
              { latitude: 10.995521, longitude: -74.794663 },
              { latitude: 10.995618, longitude: -74.794968 },
              { latitude: 10.995568, longitude: -74.795071 },
              { latitude: 10.995729, longitude: -74.795229 },
              locations.H4,
            ];
          } else if (originSede === "H4" && destinationSede === "H2") {
            newRoute = [
              locations.H4,
              { latitude: 10.995729, longitude: -74.795229 },
              { latitude: 10.995568, longitude: -74.795071 },
              { latitude: 10.995618, longitude: -74.794968 },
              { latitude: 10.995521, longitude: -74.794663 },
              { latitude: 10.994898, longitude: -74.794025 },
              { latitude: 10.995079, longitude: -74.793834 },
              { latitude: 10.994892, longitude: -74.793631 },
              { latitude: 10.994975, longitude: -74.793551 },
              { latitude: 10.995609, longitude: -74.79292 },
              { latitude: 10.995129, longitude: -74.792534 },
              locations.H2,
            ];
          } else if (originSede === "H7" && destinationSede === "H4") {
            newRoute = [
              locations.H7,
              { latitude: 10.994794, longitude: -74.792063 },
              { latitude: 10.995129, longitude: -74.792534 },
              { latitude: 10.996427, longitude: -74.793666 },
              { latitude: 10.996065, longitude: -74.794275 },
              { latitude: 10.996151, longitude: -74.794361 },
              { latitude: 10.996083, longitude: -74.794505 },
              { latitude: 10.996167, longitude: -74.794539 },
              { latitude: 10.996085, longitude: -74.794742 },
              { latitude: 10.995915, longitude: -74.794812 },
              { latitude: 10.995884, longitude: -74.794999 },
              { latitude: 10.995709, longitude: -74.795123 },
              { latitude: 10.996617, longitude: -74.79672 },
              locations.H4,
            ];
          } else if (originSede === "H4" && destinationSede === "H7") {
            newRoute = [
              locations.H4,
              { latitude: 10.996617, longitude: -74.79672 },
              { latitude: 10.995709, longitude: -74.795123 },
              { latitude: 10.995884, longitude: -74.794999 },
              { latitude: 10.995915, longitude: -74.794812 },
              { latitude: 10.996085, longitude: -74.794742 },
              { latitude: 10.996167, longitude: -74.794539 },
              { latitude: 10.996083, longitude: -74.794505 },
              { latitude: 10.996151, longitude: -74.794361 },
              { latitude: 10.996065, longitude: -74.794275 },
              { latitude: 10.996427, longitude: -74.793666 },
              { latitude: 10.995129, longitude: -74.792534 },
              { latitude: 10.994794, longitude: -74.792063 },
              locations.H7,
            ];
          } else if (originSede === "H7" && destinationSede === "H6") {
            newRoute = [
              locations.H7,
              { latitude: 10.994794, longitude: -74.792063 },
              { latitude: 10.995129, longitude: -74.792534 },
              { latitude: 10.996427, longitude: -74.793666 },
              { latitude: 10.996065, longitude: -74.794275 },
              { latitude: 10.996151, longitude: -74.794361 },
              { latitude: 10.996083, longitude: -74.794505 },
              { latitude: 10.996167, longitude: -74.794539 },
              { latitude: 10.996085, longitude: -74.794742 },
              { latitude: 10.995915, longitude: -74.794812 },
              { latitude: 10.995884, longitude: -74.794999 },
              { latitude: 10.995709, longitude: -74.795123 },
              { latitude: 10.9953, longitude: -74.795833 },
              { latitude: 10.995469, longitude: -74.79616 },
              locations.H6,
            ];
          } else if (originSede === "H6" && destinationSede === "H7") {
            newRoute = [
              locations.H6,
              { latitude: 10.995469, longitude: -74.79616 },
              { latitude: 10.9953, longitude: -74.795833 },
              { latitude: 10.995709, longitude: -74.795123 },
              { latitude: 10.995884, longitude: -74.794999 },
              { latitude: 10.995915, longitude: -74.794812 },
              { latitude: 10.996085, longitude: -74.794742 },
              { latitude: 10.996167, longitude: -74.794539 },
              { latitude: 10.996083, longitude: -74.794505 },
              { latitude: 10.996151, longitude: -74.794361 },
              { latitude: 10.996065, longitude: -74.794275 },
              { latitude: 10.996427, longitude: -74.793666 },
              { latitude: 10.995129, longitude: -74.792534 },
              { latitude: 10.994794, longitude: -74.792063 },
              locations.H7,
            ];
          } else if (originSede === "H2" && destinationSede === "H6") {
            newRoute = [
              locations.H2,
              { latitude: 10.995129, longitude: -74.792534 },
              { latitude: 10.995609, longitude: -74.79292 },
              { latitude: 10.994975, longitude: -74.793551 },
              { latitude: 10.994892, longitude: -74.793631 },
              { latitude: 10.995079, longitude: -74.793834 },
              { latitude: 10.994898, longitude: -74.794025 },
              { latitude: 10.995521, longitude: -74.794663 },
              { latitude: 10.995618, longitude: -74.794968 },
              { latitude: 10.995568, longitude: -74.795071 },
              { latitude: 10.995729, longitude: -74.795229 },
              { latitude: 10.995295, longitude: -74.795802 },
              { latitude: 10.995527, longitude: -74.796239 },
              locations.H6,
            ];
          } else if (originSede === "H6" && destinationSede === "H2") {
            newRoute = [
              locations.H6,
              { latitude: 10.995527, longitude: -74.796239 },
              { latitude: 10.995295, longitude: -74.795802 },
              { latitude: 10.995729, longitude: -74.795229 },
              { latitude: 10.995568, longitude: -74.795071 },
              { latitude: 10.995618, longitude: -74.794968 },
              { latitude: 10.995521, longitude: -74.794663 },
              { latitude: 10.994898, longitude: -74.794025 },
              { latitude: 10.995079, longitude: -74.793834 },
              { latitude: 10.994892, longitude: -74.793631 },
              { latitude: 10.994975, longitude: -74.793551 },
              { latitude: 10.995609, longitude: -74.79292 },
              { latitude: 10.995129, longitude: -74.792534 },
              locations.H2,
            ];
          } else if (originSede === "H3" && destinationSede === "H4") {
            newRoute = [
              locations.H3,
              { latitude: 10.995609, longitude: -74.79292 },
              { latitude: 10.994975, longitude: -74.793551 },
              { latitude: 10.994892, longitude: -74.793631 },
              { latitude: 10.995079, longitude: -74.793834 },
              { latitude: 10.994898, longitude: -74.794025 },
              { latitude: 10.995521, longitude: -74.794663 },
              { latitude: 10.995618, longitude: -74.794968 },
              { latitude: 10.995568, longitude: -74.795071 },
              { latitude: 10.995729, longitude: -74.795229 },
              locations.H4,
            ];
          } else if (originSede === "H4" && destinationSede === "H3") {
            newRoute = [
              locations.H4,
              { latitude: 10.995729, longitude: -74.795229 },
              { latitude: 10.995568, longitude: -74.795071 },
              { latitude: 10.995618, longitude: -74.794968 },
              { latitude: 10.995521, longitude: -74.794663 },
              { latitude: 10.994898, longitude: -74.794025 },
              { latitude: 10.995079, longitude: -74.793834 },
              { latitude: 10.994892, longitude: -74.793631 },
              { latitude: 10.994975, longitude: -74.793551 },
              { latitude: 10.995609, longitude: -74.79292 },
              locations.H3,
            ];
          } else if (originSede === "H3" && destinationSede === "H6") {
            newRoute = [
              locations.H3,
              { latitude: 10.995609, longitude: -74.79292 },
              { latitude: 10.994975, longitude: -74.793551 },
              { latitude: 10.994892, longitude: -74.793631 },
              { latitude: 10.995079, longitude: -74.793834 },
              { latitude: 10.994898, longitude: -74.794025 },
              { latitude: 10.995521, longitude: -74.794663 },
              { latitude: 10.995618, longitude: -74.794968 },
              { latitude: 10.995568, longitude: -74.795071 },
              { latitude: 10.995729, longitude: -74.795229 },
              { latitude: 10.995295, longitude: -74.795802 },
              { latitude: 10.995527, longitude: -74.796239 },
              locations.H6,
            ];
          } else if (originSede === "H6" && destinationSede === "H3") {
            newRoute = [
              locations.H6,
              { latitude: 10.995527, longitude: -74.796239 },
              { latitude: 10.995295, longitude: -74.795802 },
              { latitude: 10.995729, longitude: -74.795229 },
              { latitude: 10.995568, longitude: -74.795071 },
              { latitude: 10.995618, longitude: -74.794968 },
              { latitude: 10.995521, longitude: -74.794663 },
              { latitude: 10.994898, longitude: -74.794025 },
              { latitude: 10.995079, longitude: -74.793834 },
              { latitude: 10.994892, longitude: -74.793631 },
              { latitude: 10.994975, longitude: -74.793551 },
              { latitude: 10.995609, longitude: -74.79292 },
              locations.H3,
            ];
          } else if (originSede === "H2" && destinationSede === "H1") {
            newRoute = [
              locations.H2,
              { latitude: 10.995069, longitude: -74.792379 },
              { latitude: 10.994714, longitude: -74.792065 },
              { latitude: 10.994417, longitude: -74.792333 },
              locations.H1,
            ];
          } else if (originSede === "H4" && destinationSede === "H6") {
            newRoute = [
              locations.H4,
              { latitude: 10.995682, longitude: -74.795133 },
              { latitude: 10.995308, longitude: -74.795826 },
              { latitude: 10.995516, longitude: -74.79625 },
              locations.H6,
            ];
          } else if (originSede === "H6" && destinationSede === "H4") {
            newRoute = [
              locations.H6,
              { latitude: 10.995516, longitude: -74.79625 },
              { latitude: 10.995308, longitude: -74.795826 },
              { latitude: 10.995682, longitude: -74.795133 },
              locations.H4,
            ];
          }
        }

         return newRoute.length === 0 
    ? [locations[originSede], locations[destinationSede]]
    : newRoute;
};

type Location = { latitude: number; longitude: number };

export const animateRoute = (
  fullRoute: Location[],
  setAnimatedRoute: React.Dispatch<React.SetStateAction<Location[]>>
) => {
  if (!fullRoute || fullRoute.length === 0) return;
  setAnimatedRoute([]);
  let index = 0;

  const interpolatePoints = (
    start: Location,
    end: Location,
    steps: number
  ): Location[] => {
    const points: Location[] = [];
    for (let i = 0; i <= steps; i++) {
      const lat = start.latitude + (i / steps) * (end.latitude - start.latitude);
      const lon = start.longitude + (i / steps) * (end.longitude - start.longitude);
      points.push({ latitude: lat, longitude: lon });
    }
    return points;
  };

  const animateStep = () => {
    if (index < fullRoute.length - 1) {
      const nextSegment = interpolatePoints(
        fullRoute[index],
        fullRoute[index + 1],
        15
      );
      setAnimatedRoute((prev) => [...prev, ...nextSegment]);
      index++;
      if (index < fullRoute.length - 1) requestAnimationFrame(animateStep);
    }
  };

  animateStep();
};