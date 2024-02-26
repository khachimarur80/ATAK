<template>
    <div id="mapview">
        <div id="mapjs" class="m-container"></div>
    </div>
</template>

<script>
    import proj4 from 'proj4';

    export default {
        name: 'mapView',
        data: () => ({
            map: null,
            users: [],
            paths: null,
        }),
        props: {
            points: {
                required: true,
            }
        },
        methods: {
            initMap() {
                this.map = window.M.map({
                    container: 'mapjs',
                    controls: ['panzoom', 'scale*true', 'scaleline', 'rotate', 'location', 'backgroundlayers', 'getfeatureinfo'],
                    zoom: 19,
                    maxZoom: 22,
                    minZoom: 4,
                    _defaultProj: false,
                    projection: "EPSG:3857*m",
                    center: proj4('EPSG:4326', 'EPSG:3857', [-3.74612, 40.387603]),
                });

                const layerinicial = new window.M.layer.WMS({
                    url: 'https://www.ign.es/wms-inspire/unidades-administrativas?',
                    name: 'AU.AdministrativeBoundary',
                    legend: 'Limite administrativo',
                    tiled: false,
                }, {});

                const layerUA = new window.M.layer.WMS({
                    url: 'https://www.ign.es/wms-inspire/unidades-administrativas?',
                    name: 'AU.AdministrativeUnit',
                    legend: 'Unidad administrativa',
                    tiled: false
                }, {});

                const ocupacionSuelo = new window.M.layer.WMTS({
                    url: 'https://wmts-mapa-lidar.idee.es/lidar',
                    name: 'EL.GridCoverageDSM',
                    legend: 'Modelo Digital de Superficies LiDAR',
                    matrixSet: 'GoogleMapsCompatible',
                    visibility: false,
                }, {});

                const kml = new window.M.layer.KML({
                    url: 'https://www.ign.es/web/resources/delegaciones/delegacionesIGN.kml',
                    name:  'delegacionesIGN',
                    extract: false,
                    legend: 'Delegaciones IGN',
                    transparent: true,
                });

                this.capaVectorial = new window.M.layer.Vector({ 
                    name: 'capaVectorial',
                    legend: 'Capa Vector',
                });

                this.map.addLayers([ocupacionSuelo, layerinicial, layerUA, kml, this.capaVectorial]);
            },
            updateUsers() {
                let newFeatures = []
                for (let point in this.points) {
                    let feature = this.capaVectorial.getFeatureById('User-'+point.toString())
                    if (feature) {
                        console.log('edit')
                        this.capaVectorial.removeFeatures([feature])
                    }
                    else {
                        console.log('new')
                    }
                    feature = new window.M.Feature('User-'+point.toString(), {
                        "type": "Feature",
                        "id": 'User-'+point.toString(),
                        "geometry": {
                            "type": "MultiLineString",
                            "coordinates": [
                                this.points[point].map(p => proj4('EPSG:4326', 'EPSG:3857', [p.longitude, p.latitude])),
                            ]
                        },
                    });
                    newFeatures.push(feature)
                }
                this.capaVectorial.addFeatures(newFeatures)
            }
        },
        mounted() {
            proj4.defs("EPSG:4326", "+proj=longlat +datum=WGS84 +no_defs")
            proj4.defs("EPSG:3857", "+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext +no_defs")
            
            this.initMap()
            this.updateUsers()
        },
        watch: {
            points:{
                deep: true,
                handler() {
                    this.updateUsers()
                }
            }
        }
    }
</script>

<style scoped>
    #mapview {
        height: 100%;
        width: 50%;
    }
</style>