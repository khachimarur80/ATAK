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
            paths: null,
        }),
        props: {
            users: {
                required: true,
            }
        },
        methods: {
            initMap() {
                this.map = window.M.map({
                    container: 'mapjs',
                    controls: ['scaleline', 'location', 'scale'],
                    zoom: 16,
                    maxZoom: 22,
                    minZoom: 4,
                    _defaultProj: false,
                    projection: "EPSG:3857*m",
                    center: proj4('EPSG:4326', 'EPSG:3857', [-3.728518, 40.436676]),
                });

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

                this.capaVectorial = new window.M.layer.Vector({ 
                    name: 'capaVectorial',
                    legend: 'Capa Vector',
                });

                this.map.addLayers([ocupacionSuelo, layerUA, this.capaVectorial]);
                this.addPlugins()
            },
            addPlugins() {
                const backImgLayer = new window.M.plugin.BackImgLayer({
                    position: "BR",
                    collapsed: true,
                    collapsible: true,
                    tooltip: "Capas de fondo",
                    layerVisibility: true,
                    columnsNumber: 0,
                    empty: false,
                    ids: "mapa,hibrido",
                    titles: "Mapa,Hibrido",
                    previews:
                        "https://componentes.cnig.es/api-core/plugins/backimglayer/images/svqmapa.png,https://componentes.cnig.es/api-core/plugins/backimglayer/images/svqhibrid.png",
                    layers:
                        "WMTS*https://www.ign.es/wmts/ign-base?*IGNBaseTodo*GoogleMapsCompatible*Mapa IGN*false*image/jpeg*false*false*true,WMTS*https://www.ign.es/wmts/pnoa-ma?*OI.OrthoimageCoverage*GoogleMapsCompatible*Imagen (PNOA)*false*image/png*false*false*true",
                });

                const georefimage2 = new window.M.plugin.Georefimage2({
                    position: 'BR',
                    collapsed: true,
                    collapsible: true,
                    serverUrl: 'https://geoprint.desarrollo.guadaltel.es',
                    printTemplateUrl: 'https://geoprint.desarrollo.guadaltel.es/print/mapexport',
                    printStatusUrl: 'https://geoprint.desarrollo.guadaltel.es/print/status',
                })

                const infocoordinates = new window.M.plugin.Infocoordinates({
                    position: 'BR',
                    decimalGEOcoord: 4,
                    decimalUTMcoord: 2
                });

                const locator = new window.M.plugin.Locator({
                    position: 'BR',
                    collapsible: true,
                    collapsed: true,
                    zoom: 16,
                    pointStyle: 'pinMorado',
                    byParcelCadastre: false,
                    byCoordinates: true,
                    isDraggable: false,
                });

                const mp = new window.M.plugin.Vectors({
                    collapsed: true,
                    collapsible: true,
                    position: 'BR',
                });

                const mp1= new window.M.plugin.Rescale({
                    position: 'BR',
                });

                this.map.addPlugin(mp);
                this.map.addPlugin(mp1);
                this.map.addPlugin(locator);
                this.map.addPlugin(georefimage2);
                this.map.addPlugin(backImgLayer);
                this.map.addPlugin(infocoordinates);
            },
            updateUsers() {
                let newFeatures = []
                for (let user in this.users) {
                    let path = this.capaVectorial.getFeatureById('Path-'+user.toString())
                    
                    if (path) {
                        this.capaVectorial.removeFeatures([path])
                    }
                    path = new window.M.Feature(
                        'Path-'+user.toString(), 
                        {
                            "type": "Feature",
                            "id": 'Path-'+user.toString(),
                            "geometry": {
                                "type": "MultiLineString",
                                "coordinates": [
                                    this.users[user].map(p => proj4('EPSG:4326', 'EPSG:3857', [p.longitude, p.latitude])),
                                ],
                            },
                        },
                    );

                    let style = new window.M.style.Polygon(
                        {
                            stroke: {
                                color: '#3e6516',
                                width: 4
                            }
                        },
                        new window.M.impl.Style({})
                    )
                    path.setStyle(style)
                    console.log(path.getStyle())
                    newFeatures.push(path)
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